import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/promo-codes — List all promo codes
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const active_only = url.searchParams.get('active_only') === 'true'

  let query = auth.supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (active_only) {
    query = query.eq('is_active', true)
  }

  const { data: promoCodes, error } = await query

  if (error) {
    console.error('[Admin Promo Codes] Fetch error:', error)
    return errorResponse('Failed to fetch promo codes', 500)
  }

  // Get usage stats
  const { data: subscriptions } = await auth.supabase
    .from('subscriptions')
    .select('promo_code_id, discount_applied')

  const usageStats = promoCodes?.map(promo => ({
    ...promo,
    usage_count: subscriptions?.filter(s => s.promo_code_id === promo.id).length || 0,
    total_discount: subscriptions?.filter(s => s.promo_code_id === promo.id).reduce((sum, s) => sum + (s.discount_applied || 0), 0) || 0
  }))

  return jsonResponse({ promo_codes: usageStats })
}

// POST /api/admin/promo-codes — Create new promo code
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    code: string
    description?: string
    discount_percent?: number
    discount_amount?: number
    max_uses?: number
    expires_at?: string
    is_active?: boolean
  }>(req)

  if (!body || !body.code) {
    return errorResponse('code is required')
  }

  if (!body.discount_percent && !body.discount_amount) {
    return errorResponse('Either discount_percent or discount_amount is required')
  }

  // Check if code already exists
  const { data: existing } = await auth.supabase
    .from('promo_codes')
    .select('id')
    .eq('code', body.code.toUpperCase())
    .single()

  if (existing) {
    return errorResponse('Promo code already exists', 409)
  }

  const { data: promoCode, error } = await auth.supabase
    .from('promo_codes')
    .insert({
      code: body.code.toUpperCase(),
      description: body.description,
      discount_percent: body.discount_percent || null,
      discount_amount: body.discount_amount || null,
      max_uses: body.max_uses || null,
      expires_at: body.expires_at || null,
      is_active: body.is_active !== false
    })
    .select()
    .single()

  if (error) {
    console.error('[Admin Promo Codes] Create error:', error)
    return errorResponse('Failed to create promo code', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_promo_code',
    entity_type: 'promo_codes',
    entity_id: promoCode.id,
    details: { code: body.code },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ promo_code: promoCode }, 201)
}
