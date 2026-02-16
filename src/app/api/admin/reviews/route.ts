import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/reviews — List all reviews
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const isPublic = url.searchParams.get('is_public')

  let query = auth.supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(id, full_name, email), reviewee:profiles!reviewee_id(id, full_name, email), job:jobs!job_id(id, title)', { count: 'exact' })

  if (isPublic === 'true') query = query.eq('is_public', true)
  if (isPublic === 'false') query = query.eq('is_public', false)

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: reviews, error, count } = await query
  if (error) return errorResponse('Failed to fetch reviews', 500)

  return jsonResponse({
    reviews,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
