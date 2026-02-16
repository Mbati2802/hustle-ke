import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/disputes — List all disputes (admin)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = auth.supabase
    .from('disputes')
    .select('*, job:jobs!job_id(id, title), initiator:profiles!initiator_id(id, full_name, email), respondent:profiles!respondent_id(id, full_name, email), escrow:escrow_transactions!escrow_id(id, amount, status)', { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: disputes, error, count } = await query

  if (error) return errorResponse('Failed to fetch disputes', 500)

  return jsonResponse({
    disputes,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
