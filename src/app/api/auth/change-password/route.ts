import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/auth/change-password — Change user password
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { currentPassword, newPassword } = body as Record<string, string>

  if (!currentPassword || !newPassword) {
    return errorResponse('Current password and new password are required')
  }

  if (newPassword.length < 6) {
    return errorResponse('New password must be at least 6 characters long')
  }

  try {
    // Verify current password
    const { error: verifyError } = await auth.supabase.auth.signInWithPassword({
      email: auth.profile.email!,
      password: currentPassword,
    })

    if (verifyError) {
      return errorResponse('Current password is incorrect', 400)
    }

    // Update password
    const { error: updateError } = await auth.supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return errorResponse('Failed to update password', 500)
    }

    // Send security alert (async, don't wait)
    const { sendPasswordChangeAlert, recordSecurityEvent } = await import('@/lib/security-alerts')
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    const userAgent = req.headers.get('user-agent') || undefined
    
    recordSecurityEvent(auth.userId, auth.profile.id, 'password_change', {}, ipAddress, userAgent)
      .then(() => sendPasswordChangeAlert(auth.userId, auth.profile.id, ipAddress))
      .catch(err => console.error('[Change Password] Security alert error:', err))

    return jsonResponse({ message: 'Password updated successfully' })
  } catch (err) {
    return errorResponse('Failed to change password', 500)
  }
}
