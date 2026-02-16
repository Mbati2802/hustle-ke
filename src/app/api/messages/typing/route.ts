import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// In-memory typing status (lightweight, no DB needed for ephemeral data)
const typingMap = new Map<string, { userId: string; timestamp: number }>()

// Clean up stale entries older than 5 seconds
function cleanStale() {
  const now = Date.now()
  Array.from(typingMap.entries()).forEach(([key, val]) => {
    if (now - val.timestamp > 5000) {
      typingMap.delete(key)
    }
  })
}

// POST /api/messages/typing — Signal that user is typing
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body?.job_id) return errorResponse('job_id is required', 400)

  const key = `${body.job_id}:${auth.profile.id}`
  typingMap.set(key, { userId: auth.profile.id, timestamp: Date.now() })

  // Periodic cleanup
  cleanStale()

  return jsonResponse({ ok: true })
}

// GET /api/messages/typing?job_id=xxx — Check if the other user is typing
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')
  if (!jobId) return errorResponse('job_id is required', 400)

  cleanStale()

  // Look for any typing entry for this job that isn't the current user
  const now = Date.now()
  const typing = Array.from(typingMap.entries()).some(([key, val]) =>
    key.startsWith(`${jobId}:`) && val.userId !== auth.profile.id && now - val.timestamp < 5000
  )

  return jsonResponse({ typing })
}
