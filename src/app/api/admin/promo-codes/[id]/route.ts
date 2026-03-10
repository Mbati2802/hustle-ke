import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/promo-codes/[id] — Get promo code details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: promoCode, error } = await auth.supabase
    .from('promo_codes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !promoCode) return errorResponse('Promo code not found', 404)

  // Get usage stats
  const { data: subscriptions } = await auth.supabase
    .from('subscriptions')
    .select('id, user_id, created_at, discount_applied, profile:profiles!user_id(full_name, email)')
    .eq('promo_code_id', params.id)
    .order('created_at', { ascending: false })

  return jsonResponse({
    promo_code: {
      ...promoCode,
      usage_count: subscriptions?.length || 0,
      total_discount: subscriptions?.reduce((sum, s) => sum + (s.discount_applied || 0), 0) || 0
    },
    usage_history: subscriptions || []
  })
}

// PUT /api/admin/promo-codes/[id] — Update promo code
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    description?: string
    discount_percent?: number
    discount_amount?: number
    max_uses?: number
    expires_at?: string
    is_active?: boolean
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  const updateData: Record<string, any> = {}
  if (body.description !== undefined) updateData.description = body.description
  if (body.discount_percent !== undefined) updateData.discount_percent = body.discount_percent
  if (body.discount_amount !== undefined) updateData.discount_amount = body.discount_amount
  if (body.max_uses !== undefined) updateData.max_uses = body.max_uses
  if (body.expires_at !== undefined) updateData.expires_at = body.expires_at
  if (body.is_active !== undefined) updateData.is_active = body.is_active

  const { data: promoCode, error } = await auth.supabase
    .from('promo_codes')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[Admin Promo Codes] Update error:', error)
    return errorResponse('Failed to update promo code', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_promo_code',
    entity_type: 'promo_codes',
    entity_id: params.id,
    details: updateData,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ promo_code: promoCode })
}

// DELETE /api/admin/promo-codes/[id] — Delete promo code
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  // Check if promo code is in use
  const { data: subscriptions } = await auth.supabase
    .from('subscriptions')
    .select('id')
    .eq('promo_code_id', params.id)
    .limit(1)

  if (subscriptions && subscriptions.length > 0) {
    return errorResponse('Cannot delete promo code that has been used. Deactivate it instead.', 400)
  }

  const { error } = await auth.supabase
    .from('promo_codes')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[Admin Promo Codes] Delete error:', error)
    return errorResponse('Failed to delete promo code', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_promo_code',
    entity_type: 'promo_codes',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message: 'Promo code deleted successfully' })
}
