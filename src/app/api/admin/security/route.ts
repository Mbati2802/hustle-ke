import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/security — List all security alerts
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const severity = url.searchParams.get('severity')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('security_alerts')
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

  if (severity) {
    query = query.eq('severity', severity)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%,alert_type.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'severity':
      query = query.order('severity', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: alerts, error, count } = await query

  if (error) {
    console.error('[Admin Security] Fetch error:', error)
    return errorResponse('Failed to fetch security alerts', 500)
  }

  // Get statistics
  const { data: allAlerts } = await auth.supabase
    .from('security_alerts')
    .select('status, severity')

  const activeCount = allAlerts?.filter(a => a.status === 'active').length || 0
  const investigatingCount = allAlerts?.filter(a => a.status === 'investigating').length || 0
  const resolvedCount = allAlerts?.filter(a => a.status === 'resolved').length || 0
  const criticalCount = allAlerts?.filter(a => a.severity === 'critical').length || 0

  return jsonResponse({
    alerts,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      active: activeCount,
      investigating: investigatingCount,
      resolved: resolvedCount,
      critical: criticalCount
    }
  })
}
