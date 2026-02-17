import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { disableMFA, verifyMFAToken } from '@/lib/mfa-totp'

// POST /api/mfa/disable — Disable MFA (requires verification)
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

    // Verify MFA token before disabling
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

    // Disable MFA
    const result = await disableMFA(auth.userId)

    if (!result.success) {
      return errorResponse(result.error || 'Failed to disable MFA', 500)
    }

    return jsonResponse({
      message: 'Two-factor authentication disabled successfully',
      enabled: false,
    })
  } catch (error) {
    console.error('[MFA Disable] Error:', error)
    return errorResponse('Failed to disable MFA', 500)
  }
}
