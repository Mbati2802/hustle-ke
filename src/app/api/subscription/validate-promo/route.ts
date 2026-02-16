import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/subscription/validate-promo?code=XXXX — Validate a promo code
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim()
  if (!code) return errorResponse('Promo code is required', 400)

  const { data: promo } = await auth.adminDb
    .from('promo_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (!promo) {
    return errorResponse('Invalid or expired promo code', 404)
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

  // Calculate discount description
  let discount = ''
  if (promo.discount_percent > 0 && promo.discount_amount > 0) {
    discount = `${promo.discount_percent}% + KES ${promo.discount_amount} off`
  } else if (promo.discount_percent > 0) {
    discount = promo.discount_percent === 100 ? 'FREE (100% off)' : `${promo.discount_percent}% off`
  } else if (promo.discount_amount > 0) {
    discount = `KES ${promo.discount_amount} off`
  }

  return jsonResponse({
    valid: true,
    code: promo.code,
    discount,
    message: promo.description || `Promo code ${promo.code} applied: ${discount}`,
    applicable_plan: promo.applicable_plan,
  })
}
