import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// Simple in-memory store for typing status (use Redis in production)
const typingStatus = new Map<string, { userId: string; timestamp: number }>()

// Clean up old typing statuses (older than 5 seconds)
setInterval(() => {
  const now = Date.now()
  const entries = Array.from(typingStatus.entries())
  for (const [key, value] of entries) {
    if (now - value.timestamp > 5000) {
      typingStatus.delete(key)
    }
  }
}, 5000)

// POST /api/support/typing — Update typing status
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => ({}))
  const { ticket_id, is_typing } = body

  if (!ticket_id) {
    return errorResponse('ticket_id is required', 400)
  }

  const key = `${ticket_id}:${auth.profile.id}`

  if (is_typing) {
    typingStatus.set(key, {
      userId: auth.profile.id,
      timestamp: Date.now(),
    })
  } else {
    typingStatus.delete(key)
  }

  return jsonResponse({ success: true })
}

// GET /api/support/typing?ticket_id=xxx — Get typing status for a ticket
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const ticketId = url.searchParams.get('ticket_id')

  if (!ticketId) {
    return errorResponse('ticket_id is required', 400)
  }

  // Find all users typing in this ticket (excluding current user)
  const typing: string[] = []
  const now = Date.now()
  const entries = Array.from(typingStatus.entries())

  for (const [key, value] of entries) {
    if (key.startsWith(`${ticketId}:`) && value.userId !== auth.profile.id && now - value.timestamp < 5000) {
      typing.push(value.userId)
    }
  }

  return jsonResponse({ typing })
}
