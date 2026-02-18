import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/referrals — Get user's referral code + stats
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const profileId = auth.profile.id

  // Ensure user has a referral code
  let referralCode = auth.profile.referral_code as string | undefined
  if (!referralCode) {
    // Generate unique code: HK-{first 4 chars of name}-{random 4 chars}
    const namePart = (auth.profile.full_name || 'USER')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 4)
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    referralCode = `HK-${namePart}-${randomPart}`

    await auth.adminDb
      .from('profiles')
      .update({ referral_code: referralCode })
      .eq('id', profileId)
  }

  // Get referral stats
  const { data: referrals } = await auth.adminDb
    .from('referrals')
    .select('id, referred_email, status, reward_amount, reward_paid, created_at, converted_at, referred_id, profiles:referred_id(full_name, avatar_url)')
    .eq('referrer_id', profileId)
    .order('created_at', { ascending: false })

  const allReferrals = referrals || []
  const totalReferred = allReferrals.length
  const signedUp = allReferrals.filter(r => ['signed_up', 'converted', 'rewarded'].includes(r.status)).length
  const converted = allReferrals.filter(r => ['converted', 'rewarded'].includes(r.status)).length
  const totalEarned = allReferrals.filter(r => r.reward_paid).reduce((s, r) => s + (r.reward_amount || 0), 0)
  const pendingRewards = allReferrals.filter(r => r.status === 'converted' && !r.reward_paid).reduce((s, r) => s + (r.reward_amount || 0), 0)

  return jsonResponse({
    referral_code: referralCode,
    referral_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://hustleke.com'}/signup?ref=${referralCode}`,
    stats: {
      total_referred: totalReferred,
      signed_up: signedUp,
      converted,
      total_earned: totalEarned,
      pending_rewards: pendingRewards,
    },
    referrals: allReferrals.map(r => ({
      id: r.id,
      email: r.referred_email,
      status: r.status,
      reward: r.reward_amount,
      paid: r.reward_paid,
      created_at: r.created_at,
      converted_at: r.converted_at,
      name: (r.profiles as any)?.full_name || null,
      avatar: (r.profiles as any)?.avatar_url || null,
    })),
  })
}

// POST /api/referrals — Invite someone via email
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { email } = body as { email?: string }
  if (!email || !email.includes('@')) return errorResponse('Valid email required', 400)

  const profileId = auth.profile.id

  // Don't allow self-referral
  if (email.toLowerCase() === auth.profile.email?.toLowerCase()) {
    return errorResponse('Cannot refer yourself', 400)
  }

  // Check if already referred
  const { data: existing } = await auth.adminDb
    .from('referrals')
    .select('id')
    .eq('referrer_id', profileId)
    .eq('referred_email', email.toLowerCase())
    .single()

  if (existing) return errorResponse('This person has already been referred by you', 400)

  // Check if email is already a user
  const { data: existingUser } = await auth.adminDb
    .from('profiles')
    .select('id')
    .ilike('email', email.toLowerCase())
    .single()

  if (existingUser) return errorResponse('This person already has a HustleKE account', 400)

  // Ensure referral code exists
  let referralCode = auth.profile.referral_code as string | undefined
  if (!referralCode) {
    const namePart = (auth.profile.full_name || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4)
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    referralCode = `HK-${namePart}-${randomPart}`
    await auth.adminDb.from('profiles').update({ referral_code: referralCode }).eq('id', profileId)
  }

  // Create referral record
  const { error } = await auth.adminDb
    .from('referrals')
    .insert({
      referrer_id: profileId,
      referral_code: referralCode,
      referred_email: email.toLowerCase(),
      status: 'pending',
      reward_amount: 200, // KES 200 per successful referral
    })

  if (error) return errorResponse('Failed to create referral', 500)

  // TODO: Send invitation email via notifications system

  return jsonResponse({ message: 'Referral invite sent!' })
}
