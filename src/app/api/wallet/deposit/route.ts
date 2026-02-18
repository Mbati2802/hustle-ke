import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { initiateSTKPush, isValidKenyanPhone, formatPhoneNumber } from '@/lib/mpesa'
import { encryptPhone } from '@/lib/encryption'
import { auditWalletOperation } from '@/lib/audit-log'

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

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  const encryptedPhone = encryptPhone(phone)

  // In mock mode, use atomic transaction function
  if (result.mock) {
    const { data: depositResult, error: depositError } = await auth.adminDb.rpc('deposit_funds', {
      p_wallet_id: wallet.id,
      p_amount: amount,
      p_phone: encryptedPhone,
      p_description: 'M-Pesa deposit (mock)',
      p_metadata: {
        checkout_request_id: result.checkoutRequestId,
        merchant_request_id: result.merchantRequestId,
        mock: true,
      },
    })

    if (depositError || !depositResult?.success) {
      await auditWalletOperation(
        auth.adminDb,
        auth.userId,
        'wallet_deposit',
        amount,
        wallet.id,
        false,
        ipAddress,
        depositResult?.error || depositError?.message
      )
      return errorResponse(depositResult?.error || 'Failed to process deposit', 500)
    }

    // Audit successful deposit
    await auditWalletOperation(
      auth.adminDb,
      auth.userId,
      'wallet_deposit',
      amount,
      wallet.id,
      true,
      ipAddress
    )

    return jsonResponse({
      success: true,
      message: `Mock deposit of KES ${amount.toLocaleString()} credited instantly. Configure M-Pesa credentials for real payments.`,
      transaction_id: depositResult.transaction_id,
      new_balance: depositResult.new_balance,
      mock: true,
    })
  }

  // Real M-Pesa: Record pending transaction (will be completed by callback)
  const { data: tx, error: txError } = await auth.adminDb
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      amount: amount,
      type: 'Deposit',
      status: 'Pending',
      mpesa_phone: encryptedPhone,
      description: 'M-Pesa deposit',
      metadata: {
        checkout_request_id: result.checkoutRequestId,
        merchant_request_id: result.merchantRequestId,
        mock: false,
      },
    })
    .select()
    .single()

  if (txError) {
    console.error('[Deposit] Failed to record transaction:', txError)
    return errorResponse('Failed to record transaction', 500)
  }

  return jsonResponse({
    success: true,
    message: `STK push sent to ${phone}. Enter your M-Pesa PIN on your phone to complete the payment.`,
    checkoutRequestId: result.checkoutRequestId,
    transaction_id: tx.id,
    mock: false,
  })
}
