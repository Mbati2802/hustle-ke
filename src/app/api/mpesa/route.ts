// M-Pesa Daraja API Integration
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!
const PASSKEY = process.env.MPESA_PASSKEY!
const SHORTCODE = process.env.MPESA_SHORTCODE!
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL!

// Get access token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  
  const response = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  )
  
  const data = await response.json()
  return data.access_token
}

// Generate timestamp
function generateTimestamp(): string {
  const date = new Date()
  return date.toISOString().replace(/[^0-9]/g, '').slice(0, -3)
}

// Generate password
function generatePassword(timestamp: string): string {
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64')
  return password
}

// STK Push - Initiate payment
async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
) {
  try {
    const accessToken = await getAccessToken()
    const timestamp = generateTimestamp()
    const password = generatePassword(timestamp)
    
    // Format phone number (remove leading 0 or +254)
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254')
    
    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }
    
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    
    const data = await response.json()
    
    if (data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        customerMessage: data.CustomerMessage,
      }
    } else {
      return {
        success: false,
        errorCode: data.ResponseCode,
        errorMessage: data.ResponseDescription,
      }
    }
  } catch (error) {
    console.error('STK Push Error:', error)
    return {
      success: false,
      errorMessage: 'Failed to initiate payment',
    }
  }
}

// Check STK Push status
async function checkSTKStatus(checkoutRequestId: string) {
  try {
    const accessToken = await getAccessToken()
    const timestamp = generateTimestamp()
    const password = generatePassword(timestamp)
    
    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }
    
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('STK Query Error:', error)
    return null
  }
}

// B2C Payment - Send money to customer
async function sendB2CPayment(
  phoneNumber: string,
  amount: number,
  transactionId: string
) {
  try {
    const accessToken = await getAccessToken()
    
    // Format phone number
    const formattedPhone = phoneNumber.replace(/^(0|\+254)/, '254')
    
    const payload = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: SHORTCODE,
      PartyB: formattedPhone,
      Remarks: `Payment for job ${transactionId}`,
      QueueTimeOutURL: `${CALLBACK_URL}/b2c-timeout`,
      ResultURL: `${CALLBACK_URL}/b2c-result`,
      Occasion: 'Freelance Payment',
    }
    
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('B2C Payment Error:', error)
    return null
  }
}

// Handle M-Pesa callback
async function handleCallback(callbackData: any) {
  const supabase = createAdminClient()
  
  try {
    // Extract data from callback
    const {
      Body: {
        stkCallback: {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata,
        },
      },
    } = callbackData
    
    // Find transaction by CheckoutRequestID
    const { data: transaction } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('mpesa_checkout_request_id', CheckoutRequestID)
      .single()
    
    if (!transaction) {
      console.error('Transaction not found:', CheckoutRequestID)
      return { success: false }
    }
    
    if (ResultCode === 0) {
      // Payment successful
      const receiptNumber = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === 'MpesaReceiptNumber'
      )?.Value
      
      const amount = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === 'Amount'
      )?.Value
      
      // Update transaction status
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'Held',
          mpesa_receipt_number: receiptNumber,
          held_at: new Date().toISOString(),
          mpesa_result_code: ResultCode,
          mpesa_result_desc: ResultDesc,
        })
        .eq('id', transaction.id)
      
      // Update job status
      await supabase
        .from('jobs')
        .update({ status: 'In-Progress' })
        .eq('id', transaction.job_id)
      
      return { success: true }
    } else {
      // Payment failed
      await supabase
        .from('escrow_transactions')
        .update({
          status: 'Pending',
          mpesa_result_code: ResultCode,
          mpesa_result_desc: ResultDesc,
          failure_reason: ResultDesc,
        })
        .eq('id', transaction.id)
      
      return { success: false, error: ResultDesc }
    }
  } catch (error) {
    console.error('Callback processing error:', error)
    return { success: false }
  }
}

// API Routes
export async function POST(request: NextRequest) {
  const { action, data } = await request.json()
  
  switch (action) {
    case 'stk-push':
      const { phone, amount, reference, description } = data
      const result = await initiateSTKPush(phone, amount, reference, description)
      return NextResponse.json(result)
      
    case 'check-status':
      const { checkoutRequestId } = data
      const status = await checkSTKStatus(checkoutRequestId)
      return NextResponse.json(status)
      
    case 'b2c-payment':
      const { recipientPhone, paymentAmount, transactionId } = data
      const b2cResult = await sendB2CPayment(recipientPhone, paymentAmount, transactionId)
      return NextResponse.json(b2cResult)
      
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}
