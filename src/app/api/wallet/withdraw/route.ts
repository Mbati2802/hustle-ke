import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { withIdempotency } from '@/lib/idempotency'
import { auditWalletOperation } from '@/lib/audit-log'

// POST /api/wallet/withdraw — Withdraw funds to M-Pesa (with atomic transaction)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined

  // Use idempotency to prevent duplicate withdrawals
  return withIdempotency<Record<string, unknown>>(req, auth.adminDb, auth.userId, async () => {
    const body = await parseBody<{ amount: number; mpesa_phone?: string }>(req)
    if (!body || !body.amount) {
      return { status: 400, body: { error: 'amount is required' } }
    }
    if (body.amount < 50) {
      return { status: 400, body: { error: 'Minimum withdrawal is KES 50' } }
    }

    const phone = body.mpesa_phone || auth.profile.mpesa_phone
    if (!phone) {
      return { status: 400, body: { error: 'M-Pesa phone number is required. Set it in your profile or provide it.' } }
    }

    // Get wallet ID
    const { data: wallet } = await auth.adminDb
      .from('wallets')
      .select('id')
      .eq('user_id', auth.profile.id)
      .single()

    if (!wallet) {
      return { status: 404, body: { error: 'Wallet not found' } }
    }

    // Use atomic transaction function to prevent race conditions
    const { data: result, error } = await auth.adminDb.rpc('withdraw_funds', {
      p_wallet_id: wallet.id,
      p_amount: body.amount,
      p_phone: phone,
      p_description: `Withdrawal to M-Pesa ${phone}`,
    })

    if (error || !result?.success) {
      // Audit failed withdrawal
      await auditWalletOperation(
        auth.adminDb,
        auth.userId,
        'wallet_withdraw',
        body.amount,
        wallet.id,
        false,
        ipAddress,
        result?.error || error?.message
      )
      return { status: 400, body: { error: result?.error || 'Failed to process withdrawal' } }
    }

    // Audit successful withdrawal
    await auditWalletOperation(
      auth.adminDb,
      auth.userId,
      'wallet_withdraw',
      body.amount,
      wallet.id,
      true,
      ipAddress
    )

    // TODO: Trigger actual M-Pesa B2C payout via Daraja API
    // This would be an async operation with a callback

    return {
      status: 200,
      body: {
        message: 'Withdrawal initiated. Funds will be sent to your M-Pesa shortly.',
        transaction_id: result.transaction_id,
        new_balance: result.new_balance,
      },
    }
  })
}
