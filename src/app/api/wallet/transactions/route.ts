import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'
import { safeDecrypt } from '@/lib/encryption'

// GET /api/wallet/transactions — List wallet transactions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)

  // Get wallet first
  const { data: wallet } = await auth.supabase
    .from('wallets')
    .select('id')
    .eq('user_id', auth.profile.id)
    .single()

  if (!wallet) return errorResponse('Wallet not found', 404)

  const url = new URL(req.url)
  const type = url.searchParams.get('type')

  let query = auth.supabase
    .from('wallet_transactions')
    .select('*, job:jobs!job_id(id, title)', { count: 'exact' })
    .eq('wallet_id', wallet.id)

  if (type) {
    query = query.eq('type', type)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: transactions, error, count } = await query

  if (error) return errorResponse('Failed to fetch transactions', 500)

  // Decrypt sensitive fields before sending to client
  const decryptedTransactions = transactions?.map(tx => ({
    ...tx,
    mpesa_phone: tx.mpesa_phone ? safeDecrypt(tx.mpesa_phone) : null,
  }))

  return jsonResponse({
    transactions: decryptedTransactions,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
