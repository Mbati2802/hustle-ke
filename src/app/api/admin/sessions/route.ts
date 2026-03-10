import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/sessions — List all active user sessions
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const search = url.searchParams.get('search')
  const activeOnly = url.searchParams.get('active_only') === 'true'

  let query = auth.supabase
    .from('user_sessions')
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

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%,ip_address.ilike.%${search}%`)
  }

  query = query.order('last_activity', { ascending: false })
  query = query.range(offset, offset + limit - 1)

  const { data: sessions, error, count } = await query

  if (error) {
    console.error('[Admin Sessions] Fetch error:', error)
    return errorResponse('Failed to fetch sessions', 500)
  }

  // Get statistics
  const { data: allSessions } = await auth.supabase
    .from('user_sessions')
    .select('is_active, created_at')

  const activeCount = allSessions?.filter(s => s.is_active).length || 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayCount = allSessions?.filter(s => new Date(s.created_at) >= today).length || 0

  return jsonResponse({
    sessions,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      active: activeCount,
      today: todayCount
    }
  })
}
