import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/subscriptions — List all subscriptions with filters
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const search = url.searchParams.get('search')
  const status = url.searchParams.get('status')
  const plan = url.searchParams.get('plan')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('subscriptions')
    .select(`
      *,
      profile:profiles!user_id(
        id,
        full_name,
        email,
        role,
        avatar_url
      ),
      promo:promo_codes!promo_code_id(
        code,
        discount_percent,
        discount_amount
      )
    `, { count: 'exact' })

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (plan) {
    query = query.eq('plan', plan)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'expiring_soon':
      query = query.order('expires_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: subscriptions, error, count } = await query

  if (error) {
    console.error('[Admin Subscriptions] Fetch error:', error)
    return errorResponse('Failed to fetch subscriptions', 500)
  }

  // Calculate stats
  const { data: allSubs } = await auth.supabase
    .from('subscriptions')
    .select('status, plan, price')

  const activeCount = allSubs?.filter(s => s.status === 'active').length || 0
  const cancelledCount = allSubs?.filter(s => s.status === 'cancelled').length || 0
  const expiredCount = allSubs?.filter(s => s.status === 'expired').length || 0
  const totalRevenue = allSubs?.reduce((sum, s) => sum + (s.price || 0), 0) || 0
  const mrr = allSubs?.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0) || 0

  return jsonResponse({
    subscriptions,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      active: activeCount,
      cancelled: cancelledCount,
      expired: expiredCount,
      total_revenue: totalRevenue,
      mrr
    }
  })
}
