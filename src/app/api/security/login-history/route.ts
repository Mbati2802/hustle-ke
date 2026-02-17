import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getLoginHistory } from '@/lib/security-alerts'

// GET /api/security/login-history — Get user's login history
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')

    const history = await getLoginHistory(auth.userId, Math.min(limit, 50))

    return jsonResponse({ login_history: history })
  } catch (error) {
    console.error('[Login History API] Error:', error)
    return errorResponse('Failed to fetch login history', 500)
  }
}
