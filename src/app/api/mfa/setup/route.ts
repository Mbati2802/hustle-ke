import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { generateTOTPSecret, generateQRCode, generateBackupCodes } from '@/lib/mfa-totp'

// POST /api/mfa/setup — Generate TOTP secret and QR code for MFA setup
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const email = auth.profile.email

    if (!email) {
      return errorResponse('Email not found', 400)
    }

    // Generate TOTP secret
    const secret = generateTOTPSecret()

    // Generate QR code
    const qrCode = await generateQRCode(email, secret)

    // Generate backup codes (will be saved when user verifies)
    const backupCodes = generateBackupCodes()

    return jsonResponse({
      secret,
      qrCode,
      backupCodes,
      message: 'Scan the QR code with your authenticator app',
    })
  } catch (error) {
    console.error('[MFA Setup] Error:', error)
    return errorResponse('Failed to generate MFA setup', 500)
  }
}
