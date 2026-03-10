import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/wallets/[id] — Get wallet details with transaction history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: wallet, error } = await auth.supabase
    .from('wallets')
    .select(`
      *,
      profile:profiles!user_id(
        id,
        full_name,
        email,
        role,
        phone,
        avatar_url
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !wallet) return errorResponse('Wallet not found', 404)

  // Get transaction history with pagination
  const { data: transactions } = await auth.supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', params.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate statistics efficiently
  const stats = {
    total_deposits: 0,
    total_withdrawals: 0,
    total_escrow: 0,
    total_credits: 0,
    total_debits: 0,
    transaction_count: 0,
    last_30_days: 0,
    avg_transaction: 0
  }

  if (transactions && transactions.length > 0) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    transactions.forEach(t => {
      stats.transaction_count++
      
      if (t.type === 'Deposit') stats.total_deposits += t.amount
      if (t.type === 'Withdrawal') stats.total_withdrawals += t.amount
      if (t.type === 'Escrow') stats.total_escrow += t.amount
      if (t.type === 'Credit') stats.total_credits += t.amount
      if (t.type === 'Debit') stats.total_debits += t.amount
      
      if (new Date(t.created_at) >= thirtyDaysAgo) {
        stats.last_30_days += t.amount
      }
    })
    
    stats.avg_transaction = stats.transaction_count > 0 
      ? (stats.total_deposits + stats.total_credits) / stats.transaction_count 
      : 0
  }

  return jsonResponse({
    wallet,
    transactions: transactions || [],
    stats
  })
}

// PUT /api/admin/wallets/[id] — Manual wallet adjustment
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: 'credit' | 'debit'
    amount: number
    reason: string
  }>(req)

  if (!body || !body.action || !body.amount || !body.reason) {
    return errorResponse('action, amount, and reason are required')
  }

  if (body.amount <= 0) {
    return errorResponse('Amount must be positive')
  }

  // Get current wallet
  const { data: wallet, error: walletError } = await auth.supabase
    .from('wallets')
    .select('*, profile:profiles!user_id(id, full_name, email)')
    .eq('id', params.id)
    .single()

  if (walletError || !wallet) return errorResponse('Wallet not found', 404)

  const newBalance = body.action === 'credit' 
    ? wallet.balance + body.amount
    : wallet.balance - body.amount

  if (newBalance < 0) {
    return errorResponse('Insufficient balance for debit')
  }

  // Update wallet balance
  const { error: updateError } = await auth.supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', params.id)

  if (updateError) {
    return errorResponse('Failed to update wallet', 500)
  }

  // Create transaction record
  await auth.supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: params.id,
      type: body.action === 'credit' ? 'Deposit' : 'Withdrawal',
      amount: body.amount,
      status: 'Completed',
      description: `Admin ${body.action}: ${body.reason}`,
      metadata: {
        admin_id: auth.profile.id,
        admin_name: auth.profile.full_name,
        reason: body.reason,
        manual_adjustment: true
      }
    })

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: `wallet_${body.action}`,
    entity_type: 'wallets',
    entity_id: params.id,
    details: {
      user_id: wallet.user_id,
      user_name: wallet.profile?.full_name,
      amount: body.amount,
      reason: body.reason,
      old_balance: wallet.balance,
      new_balance: newBalance
    },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({
    message: `Wallet ${body.action}ed successfully`,
    new_balance: newBalance
  })
}
