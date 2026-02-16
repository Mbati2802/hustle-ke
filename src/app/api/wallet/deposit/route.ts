import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { initiateSTKPush, isValidKenyanPhone, formatPhoneNumber } from '@/lib/mpesa'

// POST /api/wallet/deposit — Initiate M-Pesa STK push to top up wallet
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ amount: number; phone: string }>(req)
  if (!body || !body.amount || !body.phone) {
    return errorResponse('amount and phone are required')
  }

  const amount = Math.round(body.amount)
  if (amount < 10) return errorResponse('Minimum deposit is KES 10')
  if (amount > 150000) return errorResponse('Maximum deposit is KES 150,000')

  if (!isValidKenyanPhone(body.phone)) {
    return errorResponse('Invalid phone number. Use format 07XXXXXXXX or 254XXXXXXXXX')
  }

  const phone = formatPhoneNumber(body.phone)

  // Create a pending deposit record
  const { data: wallet } = await auth.adminDb
    .from('wallets')
    .select('id')
    .eq('user_id', auth.profile.id)
    .single()

  if (!wallet) {
    return errorResponse('Wallet not found', 404)
  }

  // Initiate STK push
  const result = await initiateSTKPush(
    phone,
    amount,
    `HustleKE-${auth.profile.id.slice(0, 8)}`,
    `Wallet top-up for ${auth.profile.full_name || 'user'}`
  )

  if (!result.success) {
    return errorResponse(result.error || 'Failed to initiate payment', 500)
  }

  // Record pending deposit transaction
  const { data: tx, error: txError } = await auth.adminDb
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: amount,
      type: 'Deposit',
      status: result.mock ? 'Completed' : 'Pending',
      mpesa_phone: phone,
      description: `M-Pesa deposit${result.mock ? ' (mock)' : ''}`,
      metadata: {
        checkout_request_id: result.checkoutRequestId,
        merchant_request_id: result.merchantRequestId,
        mock: result.mock || false,
      },
    })
    .select()
    .single()

  if (txError) {
    console.error('[Deposit] Failed to record transaction:', txError)
  }

  // In mock mode, immediately credit the wallet
  if (result.mock) {
    const { data: currentWallet } = await auth.adminDb
      .from('wallets')
      .select('balance')
      .eq('id', wallet.id)
      .single()

    if (currentWallet) {
      await auth.adminDb
        .from('wallets')
        .update({ balance: currentWallet.balance + amount })
        .eq('id', wallet.id)
    }
  }

  return jsonResponse({
    success: true,
    message: result.mock
      ? `Mock deposit of KES ${amount.toLocaleString()} credited instantly. Configure M-Pesa credentials for real payments.`
      : `STK push sent to ${phone}. Enter your M-Pesa PIN on your phone to complete the payment.`,
    checkoutRequestId: result.checkoutRequestId,
    mock: result.mock || false,
    transaction_id: tx?.id,
  })
}
