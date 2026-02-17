import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getActiveSessions, revokeSession, revokeAllSessions } from '@/lib/session-manager'

// GET /api/sessions — Get user's active sessions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const sessions = await getActiveSessions(auth.userId)

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      device_info: session.device_info,
      ip_address: session.ip_address,
      location: session.location,
      is_current: session.is_current,
      last_active: session.last_active,
      created_at: session.created_at,
      expires_at: session.expires_at,
    }))

    return jsonResponse({ sessions: formattedSessions })
  } catch (error) {
    console.error('[Sessions API] Get sessions error:', error)
    return errorResponse('Failed to fetch sessions', 500)
  }
}

// DELETE /api/sessions — Revoke session(s)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')
    const revokeAll = url.searchParams.get('revoke_all') === 'true'

    if (revokeAll) {
      // Revoke all sessions except current one
      const currentSessionId = url.searchParams.get('except_session_id')
      const result = await revokeAllSessions(auth.userId, currentSessionId || undefined)

      if (!result.success) {
        return errorResponse('Failed to revoke sessions', 500)
      }

      return jsonResponse({
        message: `Successfully revoked ${result.count} session${result.count !== 1 ? 's' : ''}`,
        count: result.count,
      })
    }

    if (!sessionId) {
      return errorResponse('session_id or revoke_all parameter required', 400)
    }

    // Revoke specific session
    const result = await revokeSession(sessionId, auth.profile.id)

    if (!result.success) {
      return errorResponse('Failed to revoke session', 500)
    }

    return jsonResponse({ message: 'Session revoked successfully' })
  } catch (error) {
    console.error('[Sessions API] Revoke session error:', error)
    return errorResponse('Failed to revoke session', 500)
  }
}
