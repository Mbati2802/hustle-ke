/**
 * M-Pesa Daraja API Integration
 * 
 * Environment variables required:
 *   MPESA_CONSUMER_KEY      — Daraja app consumer key
 *   MPESA_CONSUMER_SECRET   — Daraja app consumer secret
 *   MPESA_SHORTCODE         — Business shortcode (e.g. 174379 for sandbox)
 *   MPESA_PASSKEY           — Lipa Na M-Pesa passkey
 *   MPESA_ENVIRONMENT       — 'sandbox' or 'production'
 *   NEXT_PUBLIC_APP_URL     — Your app URL for callbacks (e.g. https://yourdomain.com)
 */

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke'
const PRODUCTION_URL = 'https://api.safaricom.co.ke'

function getBaseUrl(): string {
  return process.env.MPESA_ENVIRONMENT === 'production' ? PRODUCTION_URL : SANDBOX_URL
}

function getCredentials() {
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',
  }
}

function isConfigured(): boolean {
  return !!(process.env.MPESA_CONSUMER_KEY?.trim() && process.env.MPESA_CONSUMER_SECRET?.trim())
}

/**
 * Get OAuth access token from Daraja API
 */
async function getAccessToken(): Promise<string> {
  const { consumerKey, consumerSecret } = getCredentials()
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const res = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('[M-Pesa] Auth failed:', text)
    throw new Error('Failed to authenticate with M-Pesa')
  }

  const data = await res.json()
  return data.access_token
}

/**
 * Generate the password for STK push (base64 of shortcode + passkey + timestamp)
 */
function generatePassword(timestamp: string): string {
  const { shortcode, passkey } = getCredentials()
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

/**
 * Format phone number to 254XXXXXXXXX format
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '')

  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1) // Remove +
  } else if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1)
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned
  }

  return cleaned
}

/**
 * Validate Kenyan phone number
 */
export function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  return /^254(7|1)\d{8}$/.test(formatted)
}

export interface STKPushResult {
  success: boolean
  checkoutRequestId?: string
  merchantRequestId?: string
  error?: string
  mock?: boolean
}

/**
 * Initiate M-Pesa STK Push (Lipa Na M-Pesa Online)
 */
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<STKPushResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber)

  // If credentials not configured, use mock mode
  if (!isConfigured()) {
    console.log('[M-Pesa] Mock mode — no credentials configured')
    console.log(`[M-Pesa] Would send STK push to ${formattedPhone} for KES ${amount}`)
    return {
      success: true,
      checkoutRequestId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      merchantRequestId: `mock_merchant_${Date.now()}`,
      mock: true,
    }
  }

  try {
    const accessToken = await getAccessToken()
    const { shortcode } = getCredentials()
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14)
    const password = generatePassword(timestamp)
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/api/wallet/deposit/callback`

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }

    const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
      }
    } else {
      console.error('[M-Pesa] STK push failed:', data)
      return {
        success: false,
        error: data.errorMessage || data.ResponseDescription || 'STK push failed',
      }
    }
  } catch (err) {
    console.error('[M-Pesa] STK push error:', err)
    return {
      success: false,
      error: 'Failed to connect to M-Pesa. Please try again.',
    }
  }
}
