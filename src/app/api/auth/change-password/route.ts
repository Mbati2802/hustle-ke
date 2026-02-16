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

    return jsonResponse({ message: 'Password updated successfully' })
  } catch (err) {
    return errorResponse('Failed to change password', 500)
  }
}
