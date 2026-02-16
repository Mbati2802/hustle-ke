import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/escrow — List all escrow transactions
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = auth.supabase
    .from('escrow_transactions')
    .select('*, job:jobs!job_id(id, title), client:profiles!client_id(id, full_name, email), freelancer:profiles!freelancer_id(id, full_name, email)', { count: 'exact' })

  if (status) query = query.eq('status', status)

  query = query.order('initiated_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: escrows, error, count } = await query
  if (error) return errorResponse('Failed to fetch escrows', 500)

  return jsonResponse({
    escrows,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
