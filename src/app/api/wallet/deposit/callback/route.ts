import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// M-Pesa callback — IP whitelist verification (called by Safaricom servers)
// Safaricom M-Pesa callback IPs (update with actual IPs from Safaricom documentation)
const MPESA_ALLOWED_IPS = [
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '127.0.0.1', // localhost for testing
]

// POST /api/wallet/deposit/callback
export async function POST(req: NextRequest) {
  try {
    // Verify request is from M-Pesa servers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    
    // In production, enforce IP whitelist (skip in development)
    if (process.env.NODE_ENV === 'production' && !MPESA_ALLOWED_IPS.includes(clientIP)) {
      console.error(`[M-Pesa Callback] Unauthorized IP: ${clientIP}`)
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    console.log('[M-Pesa Callback] Received from IP:', clientIP, 'Body:', JSON.stringify(body, null, 2))

    const callback = body?.Body?.stkCallback
    if (!callback) {
      console.error('[M-Pesa Callback] Invalid payload — no stkCallback')
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = callback

    // Create admin client to bypass RLS
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the pending transaction by checkout_request_id in metadata
    const { data: transactions } = await adminDb
      .from('wallet_transactions')
      .select('*')
      .eq('status', 'Pending')
      .eq('type', 'Deposit')

    // Match by checkout_request_id in metadata JSONB
    const tx = transactions?.find(
      (t: Record<string, unknown>) => {
        const meta = t.metadata as Record<string, unknown> | null
        return meta?.checkout_request_id === CheckoutRequestID
      }
    )

    if (!tx) {
      console.error('[M-Pesa Callback] No matching pending transaction for:', CheckoutRequestID)
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    if (ResultCode === 0) {
      // Payment successful — extract M-Pesa receipt
      const callbackMetadata = callback.CallbackMetadata?.Item || []
      const mpesaReceipt = callbackMetadata.find(
        (i: Record<string, unknown>) => i.Name === 'MpesaReceiptNumber'
      )?.Value
      const transactionDate = callbackMetadata.find(
        (i: Record<string, unknown>) => i.Name === 'TransactionDate'
      )?.Value

      // Update transaction to completed
      await adminDb
        .from('wallet_transactions')
        .update({
          status: 'Completed',
          mpesa_receipt_number: mpesaReceipt || null,
          metadata: {
            ...(tx.metadata as Record<string, unknown>),
            transaction_date: transactionDate,
            merchant_request_id: MerchantRequestID,
            result_desc: ResultDesc,
          },
        })
        .eq('id', tx.id)

      // Credit the wallet
      const { data: wallet } = await adminDb
        .from('wallets')
        .select('balance')
        .eq('id', tx.wallet_id)
        .single()

      if (wallet) {
        await adminDb
          .from('wallets')
          .update({ balance: wallet.balance + tx.amount })
          .eq('id', tx.wallet_id)

        console.log(`[M-Pesa Callback] Credited KES ${tx.amount} to wallet ${tx.wallet_id}`)
      }
    } else {
      // Payment failed or cancelled
      console.log(`[M-Pesa Callback] Payment failed: ${ResultCode} — ${ResultDesc}`)
      await adminDb
        .from('wallet_transactions')
        .update({
          status: 'Failed',
          description: `M-Pesa deposit — ${ResultDesc}`,
          metadata: {
            ...(tx.metadata as Record<string, unknown>),
            result_code: ResultCode,
            result_desc: ResultDesc,
            merchant_request_id: MerchantRequestID,
          },
        })
        .eq('id', tx.id)
    }

    // Always return success to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (err) {
    console.error('[M-Pesa Callback] Error:', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
