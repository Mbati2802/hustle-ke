import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/wallets — List all wallets with filters
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const search = url.searchParams.get('search')
  const minBalance = url.searchParams.get('min_balance')
  const maxBalance = url.searchParams.get('max_balance')
  const sort = url.searchParams.get('sort') || 'balance_desc'

  let query = auth.supabase
    .from('wallets')
    .select(`
      *,
      profile:profiles!user_id(
        id,
        full_name,
        email,
        role,
        avatar_url
      )
    `, { count: 'exact' })

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`)
  }
  if (minBalance) {
    query = query.gte('balance', parseFloat(minBalance))
  }
  if (maxBalance) {
    query = query.lte('balance', parseFloat(maxBalance))
  }

  switch (sort) {
    case 'balance_asc':
      query = query.order('balance', { ascending: true })
      break
    case 'balance_desc':
      query = query.order('balance', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    default:
      query = query.order('balance', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: wallets, error, count } = await query

  if (error) {
    console.error('[Admin Wallets] Fetch error:', error)
    return errorResponse('Failed to fetch wallets', 500)
  }

  // Calculate totals
  const { data: totals } = await auth.supabase
    .from('wallets')
    .select('balance')

  const totalBalance = totals?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  return jsonResponse({
    wallets,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total_wallets: count || 0,
      total_balance: totalBalance
    }
  })
}
