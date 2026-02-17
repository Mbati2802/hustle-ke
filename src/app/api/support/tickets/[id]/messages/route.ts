import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody, getPagination } from '@/lib/api-utils'
import { sanitizeHTML } from '@/lib/sanitize'

interface SendMessageBody {
  message?: string
}

// GET /api/support/tickets/:id/messages — list messages for my ticket
// POST /api/support/tickets/:id/messages — send message for my ticket
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id: ticketId } = await params
  if (!ticketId) return errorResponse('Missing ticket id', 400)

  const { limit, offset } = getPagination(req, 50)

  const { data: ticket } = await auth.adminDb
    .from('support_tickets')
    .select('id, user_id')
    .eq('id', ticketId)
    .single()

  if (!ticket) return errorResponse('Ticket not found', 404)
  if (ticket.user_id !== auth.profile.id) return errorResponse('Forbidden', 403)

  const { data: messages, error, count } = await auth.adminDb
    .from('support_messages')
    .select('id, ticket_id, sender_profile_id, sender_type, message, created_at, sender:profiles!sender_profile_id(id, full_name, avatar_url)', { count: 'exact' })
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[Support] list messages error:', error)
    return errorResponse('Failed to fetch messages', 500)
  }

  return jsonResponse({
    messages: messages || [],
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id: ticketId } = await params
  if (!ticketId) return errorResponse('Missing ticket id', 400)

  const body = await parseBody<SendMessageBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const msg = (body.message || '').toString().trim()
  if (!msg) return errorResponse('Message is required', 400)
  if (msg.length > 4000) return errorResponse('Message too long (max 4000 characters)', 400)

  // Sanitize message to prevent XSS
  const sanitizedMessage = sanitizeHTML(msg)

  const { data: ticket } = await auth.adminDb
    .from('support_tickets')
    .select('id, user_id, status')
    .eq('id', ticketId)
    .single()

  if (!ticket) return errorResponse('Ticket not found', 404)
  if (ticket.user_id !== auth.profile.id) return errorResponse('Forbidden', 403)
  if (ticket.status === 'Closed') return errorResponse('Ticket is closed', 400)

  const now = new Date().toISOString()

  const { data: created, error } = await auth.adminDb
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_profile_id: auth.profile.id,
      sender_type: 'user',
      message: sanitizedMessage,
      created_at: now,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Support] send message error:', error)
    return errorResponse('Failed to send message', 500)
  }

  await auth.adminDb
    .from('support_tickets')
    .update({ last_message_at: now, updated_at: now, status: ticket.status === 'Resolved' ? 'Open' : ticket.status })
    .eq('id', ticketId)

  return jsonResponse({ message: created })
}
