import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { regenerateBackupCodes, verifyMFAToken } from '@/lib/mfa-totp'

// POST /api/mfa/backup-codes — Regenerate backup codes (requires MFA verification)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await parseBody<{ token: string }>(req)
    if (!body) return errorResponse('Invalid request body')

    const { token } = body

    if (!token) {
      return errorResponse('Verification token is required', 400)
    }

    // Verify MFA token before regenerating
    const verification = await verifyMFAToken(
      auth.userId,
      auth.profile.id,
      token,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    )

    if (!verification.success) {
      return errorResponse('Invalid verification code', 400)
    }

    // Regenerate backup codes
    const result = await regenerateBackupCodes(auth.userId)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to regenerate backup codes', 500)
    }

    return jsonResponse({
      message: 'Backup codes regenerated successfully',
      backup_codes: result.codes,
    })
  } catch (error) {
    console.error('[MFA Backup Codes] Error:', error)
    return errorResponse('Failed to regenerate backup codes', 500)
  }
}
