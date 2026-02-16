import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/activity — Get activity log
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const entityType = url.searchParams.get('entity_type')
  const action = url.searchParams.get('action')

  let query = auth.supabase
    .from('activity_log')
    .select('*, admin:profiles!admin_id(id, full_name, email, avatar_url)', { count: 'exact' })

  if (entityType) query = query.eq('entity_type', entityType)
  if (action) query = query.eq('action', action)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: activities, error, count } = await query
  if (error) return errorResponse('Failed to fetch activity log', 500)

  return jsonResponse({
    activities,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
