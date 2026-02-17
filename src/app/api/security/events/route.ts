import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getSecurityEvents } from '@/lib/security-alerts'

// GET /api/security/events — Get user's security events
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const events = await getSecurityEvents(auth.userId, Math.min(limit, 50))

    return jsonResponse({ security_events: events })
  } catch (error) {
    console.error('[Security Events API] Error:', error)
    return errorResponse('Failed to fetch security events', 500)
  }
}
