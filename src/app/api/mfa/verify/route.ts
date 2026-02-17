import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { verifyMFAToken } from '@/lib/mfa-totp'

// POST /api/mfa/verify — Verify MFA token during login
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

    const result = await verifyMFAToken(
      auth.userId,
      auth.profile.id,
      token,
      req.headers.get('x-forwarded-for') || undefined,
      req.headers.get('user-agent') || undefined
    )

    if (!result.success) {
      return errorResponse(result.error || 'Invalid verification code', 400)
    }

    return jsonResponse({
      message: 'Verification successful',
      method: result.method,
    })
  } catch (error) {
    console.error('[MFA Verify] Error:', error)
    return errorResponse('Verification failed', 500)
  }
}
