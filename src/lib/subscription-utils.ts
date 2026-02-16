import { SupabaseClient } from '@supabase/supabase-js'
import { notifySubscriptionEvent } from '@/lib/notifications'

// Plan definitions — single source of truth
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    service_fee_percent: 6,
    max_proposals_per_day: 10,
    featured_profile: false,
    priority_support: false,
    advanced_analytics: false,
  },
  pro: {
    name: 'Pro',
    price: 500,
    service_fee_percent: 4,
    max_proposals_per_day: 20,
    featured_profile: true,
    priority_support: true,
    advanced_analytics: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 5000,
    service_fee_percent: 2,
    max_proposals_per_day: 999, // effectively unlimited
    featured_profile: true,
    priority_support: true,
    advanced_analytics: true,
    max_seats: 10,
    bulk_hiring: true,
    api_access: true,
    custom_contracts: true,
    dedicated_account_manager: true,
    freelancer_bench: true,
    invoice_generation: true,
    team_analytics: true,
    sla_guarantee: '2hr',
  },
} as const

export type PlanKey = keyof typeof PLANS

// Grace period: users keep Pro benefits for this many days after expiry
export const GRACE_PERIOD_DAYS = 3

export interface UserPlanInfo {
  plan: PlanKey
  service_fee_percent: number
  max_proposals_per_day: number
  featured_profile: boolean
  is_pro: boolean
  expires_at?: string | null
  in_grace_period?: boolean
  auto_renewed?: boolean
}

/**
 * Get the active plan info for a user (by profile id).
 * Handles: active, cancelled (benefits until expires_at), expired (auto-renewal + grace period).
 * Uses adminDb (service role) to bypass RLS.
 */
export async function getUserPlan(adminDb: SupabaseClient, profileId: string): Promise<UserPlanInfo> {
  // Fetch any active OR cancelled subscription (cancelled still has benefits until expires_at)
  const { data: subscription } = await adminDb
    .from('subscriptions')
    .select('id, plan, status, expires_at, auto_renew')
    .eq('user_id', profileId)
    .in('status', ['active', 'cancelled'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  let planKey: PlanKey = 'free'
  let inGracePeriod = false
  let autoRenewed = false

  if (subscription && ['pro', 'enterprise'].includes(subscription.plan)) {
    const now = new Date()
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null

    if (!expiresAt || expiresAt > now) {
      // Still within the billing period — benefits active
      planKey = subscription.plan as PlanKey
    } else {
      // Subscription has expired — check auto-renewal and grace period
      const gracePeriodEnd = new Date(expiresAt)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS)

      // Only attempt auto-renewal for 'active' subscriptions (not cancelled ones)
      if (subscription.status === 'active' && subscription.auto_renew !== false) {
        const renewed = await attemptAutoRenewal(adminDb, profileId, subscription)
        if (renewed) {
          planKey = subscription.plan as PlanKey
          autoRenewed = true
        } else if (now < gracePeriodEnd) {
          // Auto-renewal failed but still in grace period — keep benefits
          planKey = subscription.plan as PlanKey
          inGracePeriod = true
        } else {
          // Grace period ended, no renewal — expire the subscription
          await adminDb
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id)
        }
      } else {
        // Cancelled subscription past expires_at — fully expire it
        if (subscription.status === 'cancelled') {
          await adminDb
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id)
        } else if (now < gracePeriodEnd) {
          // Active but auto_renew=false, still in grace
          planKey = subscription.plan as PlanKey
          inGracePeriod = true
        } else {
          await adminDb
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id)
        }
      }
    }
  }

  const plan = PLANS[planKey]

  return {
    plan: planKey,
    service_fee_percent: plan.service_fee_percent,
    max_proposals_per_day: plan.max_proposals_per_day,
    featured_profile: plan.featured_profile,
    is_pro: planKey !== 'free',
    expires_at: subscription?.expires_at,
    in_grace_period: inGracePeriod,
    auto_renewed: autoRenewed,
  }
}

/**
 * Attempt to auto-renew an expired subscription by charging the user's wallet.
 * Returns true if renewal succeeded, false if wallet had insufficient balance.
 */
async function attemptAutoRenewal(
  adminDb: SupabaseClient,
  profileId: string,
  subscription: { id: string; plan: string; expires_at: string | null }
): Promise<boolean> {
  const planKey = subscription.plan as PlanKey
  const price = PLANS[planKey]?.price || 0

  // Free plans don't need renewal payment
  if (price === 0) {
    const newExpiry = new Date()
    newExpiry.setMonth(newExpiry.getMonth() + 1)
    await adminDb
      .from('subscriptions')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', subscription.id)
    return true
  }

  // Check wallet balance
  const { data: wallet } = await adminDb
    .from('wallets')
    .select('id, balance')
    .eq('user_id', profileId)
    .single()

  if (!wallet || wallet.balance < price) {
    // Notify user of failed auto-renewal
    notifySubscriptionEvent(adminDb, profileId, 'low_balance', {
      planName: PLANS[planKey].name,
      balance: wallet?.balance || 0,
      price,
    }).catch(console.error)
    return false // Insufficient balance
  }

  // Deduct from wallet
  const { error: walletErr } = await adminDb
    .from('wallets')
    .update({ balance: wallet.balance - price })
    .eq('id', wallet.id)

  if (walletErr) return false

  // Record wallet transaction
  await adminDb.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'Subscription',
    amount: price,
    description: `${PLANS[planKey].name} plan auto-renewal - ${new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`,
    status: 'Completed',
  })

  // Extend subscription by 1 month from now
  const newExpiry = new Date()
  newExpiry.setMonth(newExpiry.getMonth() + 1)
  await adminDb
    .from('subscriptions')
    .update({
      expires_at: newExpiry.toISOString(),
      renewed_at: new Date().toISOString(),
      amount_paid: price,
    })
    .eq('id', subscription.id)

  // Notify user of successful auto-renewal
  notifySubscriptionEvent(adminDb, profileId, 'renewed', {
    planName: PLANS[planKey].name,
    price,
  }).catch(console.error)

  return true
}

/**
 * Calculate service fee and tax for a given amount based on user's plan.
 */
export function calculateFees(amount: number, serviceFeePercent: number) {
  const serviceFee = Math.round(amount * (serviceFeePercent / 100))
  const taxAmount = Math.round(serviceFee * 0.16) // 16% VAT on service fee
  return { serviceFee, taxAmount }
}

/**
 * Count how many proposals a user submitted today.
 */
export async function getTodayProposalCount(adminDb: SupabaseClient, profileId: string): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await adminDb
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('freelancer_id', profileId)
    .gte('submitted_at', todayStart.toISOString())

  return count || 0
}

/**
 * Calculate hustle score from profile data.
 * Formula:
 *  - Base: 10
 *  - ID Verified: +10
 *  - Profile Complete (has bio, title, skills, county): +5
 *  - Skill Tested: +15
 *  - Per Job Completed: +20 (max 40, so 2+ jobs = capped)
 *  - Per Dispute: -50
 *  - Range: 0–100
 */
export function calculateHustleScore(profile: {
  id_verified?: boolean
  skill_tested?: boolean
  jobs_completed?: number
  disputes_count?: number
  bio?: string | null
  title?: string | null
  skills?: string[] | null
  county?: string | null
}): number {
  let score = 10 // Base

  if (profile.id_verified) score += 10
  if (profile.skill_tested) score += 15

  // Profile complete = has bio, title, at least 1 skill, and county
  const profileComplete = !!(profile.bio && profile.title && profile.skills && profile.skills.length > 0 && profile.county)
  if (profileComplete) score += 5

  score += Math.min((profile.jobs_completed || 0) * 20, 40)
  score -= (profile.disputes_count || 0) * 50

  return Math.max(0, Math.min(100, score))
}

/**
 * Recalculate and persist hustle_score for a given profile.
 * Also logs the change to hustle_score_log if the score changed.
 */
export async function recalculateHustleScore(
  adminDb: SupabaseClient,
  profileId: string,
  reason: string = 'recalculation'
): Promise<number> {
  // Fetch current profile data
  const { data: profile } = await adminDb
    .from('profiles')
    .select('id, hustle_score, id_verified, skill_tested, jobs_completed, bio, title, skills, county')
    .eq('id', profileId)
    .single()

  if (!profile) return 0

  // Count active disputes for this user
  const { count: disputesCount } = await adminDb
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .or(`initiator_id.eq.${profileId},respondent_id.eq.${profileId}`)

  const newScore = calculateHustleScore({
    id_verified: profile.id_verified,
    skill_tested: profile.skill_tested,
    jobs_completed: profile.jobs_completed || 0,
    disputes_count: disputesCount || 0,
    bio: profile.bio,
    title: profile.title,
    skills: profile.skills,
    county: profile.county,
  })

  const oldScore = profile.hustle_score || 0

  // Update profile with new score
  await adminDb
    .from('profiles')
    .update({ hustle_score: newScore })
    .eq('id', profileId)

  // Log the score change if it actually changed
  if (newScore !== oldScore) {
    try {
      await adminDb.from('hustle_score_log').insert({
        user_id: profileId,
        previous_score: oldScore,
        new_score: newScore,
        change_amount: newScore - oldScore,
        reason,
        category: reason.includes('escrow') ? 'Job' : reason.includes('profile') ? 'Profile' : reason.includes('review') ? 'Review' : 'Other',
      })
    } catch {} // Best-effort logging
  }

  return newScore
}
