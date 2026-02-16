import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/messages — List all messages (admin)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req, 30)
  const url = new URL(req.url)
  const search = url.searchParams.get('search')

  let query = auth.supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, full_name, email), receiver:profiles!receiver_id(id, full_name, email), job:jobs!job_id(id, title)', { count: 'exact' })

  if (search) {
    query = query.ilike('content', `%${search}%`)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: messages, error, count } = await query
  if (error) return errorResponse('Failed to fetch messages', 500)

  return jsonResponse({
    messages,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
