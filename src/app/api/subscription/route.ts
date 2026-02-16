import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { PLANS } from '@/lib/subscription-utils'
import { notifySubscriptionEvent } from '@/lib/notifications'

// GET /api/subscription — Get current user's subscription
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Fetch active OR cancelled (cancelled still has benefits until expires_at)
  const { data: subscription } = await auth.adminDb
    .from('subscriptions')
    .select('*, promo_codes(code, description)')
    .eq('user_id', auth.profile.id)
    .in('status', ['active', 'cancelled'])
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  const plan = subscription?.plan || 'free'
  const planDetails = PLANS[plan as keyof typeof PLANS] || PLANS.free

  // Compute lifecycle info
  let lifecycle: Record<string, unknown> = { status: 'free' }
  if (subscription && ['pro', 'enterprise'].includes(subscription.plan)) {
    const now = new Date()
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null
    const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

    lifecycle = {
      status: subscription.status,
      expires_at: subscription.expires_at,
      days_until_expiry: daysUntilExpiry,
      auto_renew: subscription.auto_renew !== false,
      is_active: !expiresAt || expiresAt > now,
      in_grace_period: expiresAt && expiresAt < now && daysUntilExpiry !== null && daysUntilExpiry >= -3,
      renewed_at: subscription.renewed_at,
    }
  }

  return jsonResponse({
    subscription: subscription || { plan: 'free', status: 'active' },
    plan_details: planDetails,
    plans: PLANS,
    lifecycle,
  })
}

// POST /api/subscription — Subscribe to a plan or cancel
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { plan, action, promo_code } = body as Record<string, string>
  const currentAction = action || 'subscribe'

  // --- Cancel ---
  if (currentAction === 'cancel') {
    // Fetch current subscription to get expires_at for the user message
    const { data: currentSub } = await auth.adminDb
      .from('subscriptions')
      .select('id, expires_at')
      .eq('user_id', auth.profile.id)
      .eq('status', 'active')
      .single()

    if (!currentSub) return errorResponse('No active subscription to cancel', 400)

    const { error } = await auth.adminDb
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), auto_renew: false })
      .eq('id', currentSub.id)

    if (error) return errorResponse('Failed to cancel subscription', 500)

    const expiryDate = currentSub.expires_at
      ? new Date(currentSub.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'the end of your billing period'

    // Notify user of cancellation (site + email + SMS)
    notifySubscriptionEvent(auth.adminDb, auth.profile.id, 'cancelled', {
      planName: 'Pro',
      expiryDate,
    }).catch(console.error)

    return jsonResponse({
      message: `Subscription cancelled. Your Pro benefits will remain active until ${expiryDate}. You can re-subscribe anytime.`,
      benefits_until: currentSub.expires_at,
    })
  }

  // --- Toggle auto-renew ---
  if (currentAction === 'toggle_auto_renew') {
    const { data: currentSub } = await auth.adminDb
      .from('subscriptions')
      .select('id, auto_renew')
      .eq('user_id', auth.profile.id)
      .eq('status', 'active')
      .single()

    if (!currentSub) return errorResponse('No active subscription', 400)

    const newValue = !(currentSub.auto_renew !== false)
    await auth.adminDb
      .from('subscriptions')
      .update({ auto_renew: newValue })
      .eq('id', currentSub.id)

    return jsonResponse({
      message: newValue ? 'Auto-renewal enabled. Your subscription will renew automatically.' : 'Auto-renewal disabled. Your subscription will expire at the end of the billing period.',
      auto_renew: newValue,
    })
  }

  // --- Subscribe ---
  if (!plan || !['pro', 'enterprise'].includes(plan)) {
    return errorResponse('Invalid plan. Choose "pro" or "enterprise".', 400)
  }

  // Check if user already has an active subscription
  const { data: existing } = await auth.adminDb
    .from('subscriptions')
    .select('id, plan')
    .eq('user_id', auth.profile.id)
    .eq('status', 'active')
    .single()

  if (existing) {
    if (existing.plan === plan) {
      return errorResponse(`You are already on the ${plan} plan`, 400)
    }
    // Upgrade/downgrade: cancel old, create new
    await auth.adminDb
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', existing.id)
  }

  // --- Validate promo code ---
  let promoCodeId: string | null = null
  let discountPercent = 0
  let discountAmount = 0

  if (promo_code) {
    const { data: promo } = await auth.adminDb
      .from('promo_codes')
      .select('*')
      .eq('code', promo_code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (!promo) {
      return errorResponse('Invalid or expired promo code', 400)
    }

    // Check if applicable to this plan
    if (promo.applicable_plan !== 'all' && promo.applicable_plan !== plan) {
      return errorResponse(`This promo code is not valid for the ${plan} plan`, 400)
    }

    // Check max uses
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return errorResponse('This promo code has reached its maximum uses', 400)
    }

    // Check validity dates
    const now = new Date()
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return errorResponse('This promo code is not yet active', 400)
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return errorResponse('This promo code has expired', 400)
    }

    promoCodeId = promo.id
    discountPercent = promo.discount_percent || 0
    discountAmount = promo.discount_amount || 0
  }

  // --- Calculate final price ---
  const originalPrice = PLANS[plan as keyof typeof PLANS]?.price || 0
  let finalPrice = originalPrice

  if (discountPercent > 0) {
    finalPrice = Math.round(originalPrice * (1 - discountPercent / 100))
  }
  if (discountAmount > 0) {
    finalPrice = Math.max(0, finalPrice - discountAmount)
  }

  const totalDiscount = originalPrice - finalPrice

  // --- Deduct from wallet ---
  if (finalPrice > 0) {
    // Get wallet (need actual wallet.id for wallet_transactions FK)
    const { data: wallet } = await auth.adminDb
      .from('wallets')
      .select('id, balance')
      .eq('user_id', auth.profile.id)
      .single()

    if (!wallet) {
      return errorResponse('Wallet not found. Please contact support.', 404)
    }

    if (wallet.balance < finalPrice) {
      return errorResponse(
        `Insufficient wallet balance. ${plan === 'pro' ? 'Pro' : 'Enterprise'} plan costs KES ${finalPrice}${totalDiscount > 0 ? ` (KES ${totalDiscount} discount applied)` : ''}/month. Your balance: KES ${wallet.balance}. Top up your wallet first.`,
        400
      )
    }

    // Deduct from wallet
    await auth.adminDb
      .from('wallets')
      .update({ balance: wallet.balance - finalPrice })
      .eq('id', wallet.id)

    // Record transaction with correct wallet_id, type enum, and status casing
    await auth.adminDb
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'Subscription',
        amount: finalPrice,
        description: `${plan === 'pro' ? 'Pro' : 'Enterprise'} plan subscription${totalDiscount > 0 ? ` (KES ${totalDiscount} discount)` : ''} - ${new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}`,
        status: 'Completed',
      })
  }

  // --- Increment promo code usage ---
  if (promoCodeId) {
    const { data: promoData } = await auth.adminDb
      .from('promo_codes')
      .select('current_uses')
      .eq('id', promoCodeId)
      .single()

    if (promoData) {
      await auth.adminDb
        .from('promo_codes')
        .update({ current_uses: (promoData.current_uses || 0) + 1 })
        .eq('id', promoCodeId)
    }
  }

  // --- Create subscription ---
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  const { data: subscription, error } = await auth.adminDb
    .from('subscriptions')
    .insert({
      user_id: auth.profile.id,
      plan,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: finalPrice,
      original_price: originalPrice,
      discount_applied: totalDiscount,
      promo_code_id: promoCodeId,
    })
    .select()
    .single()

  if (error) {
    console.error('[Subscription] Insert error:', error)
    return errorResponse('Failed to create subscription', 500)
  }

  const planLabel = plan === 'pro' ? 'Pro' : 'Enterprise'
  const discountMsg = totalDiscount > 0 ? ` (KES ${totalDiscount} discount applied!)` : ''
  const priceMsg = finalPrice === 0 ? ' — completely free this month!' : ` KES ${finalPrice} deducted from wallet.`

  // Notify user of subscription (site + email + SMS)
  notifySubscriptionEvent(auth.adminDb, auth.profile.id, 'subscribed', {
    planName: planLabel,
  }).catch(console.error)

  return jsonResponse({
    subscription,
    message: `Successfully subscribed to ${planLabel} plan!${discountMsg}${priceMsg}`,
    discount_applied: totalDiscount,
    amount_charged: finalPrice,
  }, 201)
}
