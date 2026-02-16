import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/wallet/withdraw — Withdraw funds to M-Pesa
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ amount: number; mpesa_phone?: string }>(req)
  if (!body || !body.amount) return errorResponse('amount is required')
  if (body.amount < 50) return errorResponse('Minimum withdrawal is KES 50')

  const phone = body.mpesa_phone || auth.profile.mpesa_phone
  if (!phone) return errorResponse('M-Pesa phone number is required. Set it in your profile or provide it.')

  // Get wallet
  const { data: wallet } = await auth.supabase
    .from('wallets')
    .select('*')
    .eq('user_id', auth.profile.id)
    .single()

  if (!wallet) return errorResponse('Wallet not found', 404)
  if (wallet.balance < body.amount) return errorResponse('Insufficient balance')

  // Deduct from wallet
  const { error: updateError } = await auth.supabase
    .from('wallets')
    .update({
      balance: wallet.balance - body.amount,
      total_withdrawn: wallet.total_withdrawn + body.amount,
    })
    .eq('id', wallet.id)

  if (updateError) return errorResponse('Failed to process withdrawal', 500)

  // Record transaction
  const { data: tx, error: txError } = await auth.supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: -body.amount,
      type: 'Withdrawal',
      mpesa_phone: phone,
      description: `Withdrawal to M-Pesa ${phone}`,
    })
    .select()
    .single()

  if (txError) return errorResponse('Withdrawal recorded but transaction log failed', 500)

  // TODO: Trigger actual M-Pesa B2C payout via Daraja API
  // This would be an async operation with a callback

  return jsonResponse({
    message: 'Withdrawal initiated. Funds will be sent to your M-Pesa shortly.',
    transaction: tx,
  })
}
