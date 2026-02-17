import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { verifyTOTPToken, enableMFA, hashBackupCode } from '@/lib/mfa-totp'

// POST /api/mfa/enable — Verify TOTP and enable MFA
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await parseBody<{ secret: string; token: string; backupCodes: string[] }>(req)
    if (!body) return errorResponse('Invalid request body')

    const { secret, token, backupCodes } = body

    if (!secret || !token || !backupCodes || backupCodes.length === 0) {
      return errorResponse('Secret, verification token, and backup codes are required', 400)
    }

    // Verify the TOTP token
    const isValid = verifyTOTPToken(token, secret)

    if (!isValid) {
      return errorResponse('Invalid verification code. Please try again.', 400)
    }

    // Enable MFA
    const result = await enableMFA(auth.userId, auth.profile.id, secret, backupCodes)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to enable MFA', 500)
    }

    return jsonResponse({
      message: 'Two-factor authentication enabled successfully',
      enabled: true,
    })
  } catch (error) {
    console.error('[MFA Enable] Error:', error)
    return errorResponse('Failed to enable MFA', 500)
  }
}
