import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/audit-logs — List all audit logs with filters
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const action = url.searchParams.get('action')
  const entityType = url.searchParams.get('entity_type')
  const userId = url.searchParams.get('user_id')
  const profileId = url.searchParams.get('profile_id')
  const startDate = url.searchParams.get('start_date')
  const endDate = url.searchParams.get('end_date')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('audit_logs')
    .select(`
      *,
      user:auth.users!user_id(id, email),
      profile:profiles!profile_id(id, full_name, email, role)
    `, { count: 'exact' })

  if (action) {
    query = query.eq('action', action)
  }
  if (entityType) {
    query = query.eq('entity_type', entityType)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (profileId) {
    query = query.eq('profile_id', profileId)
  }
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (search) {
    query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%,ip_address.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: logs, error, count } = await query

  if (error) {
    console.error('[Admin Audit Logs] Fetch error:', error)
    return errorResponse('Failed to fetch audit logs', 500)
  }

  // Get action statistics
  const { data: allLogs } = await auth.supabase
    .from('audit_logs')
    .select('action, severity')

  const actionCounts: Record<string, number> = {}
  allLogs?.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  const criticalCount = allLogs?.filter(l => l.severity === 'critical').length || 0
  const warningCount = allLogs?.filter(l => l.severity === 'warning').length || 0

  return jsonResponse({
    logs,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      critical: criticalCount,
      warning: warningCount,
      action_counts: actionCounts
    }
  })
}
