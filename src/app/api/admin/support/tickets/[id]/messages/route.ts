import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody, getPagination } from '@/lib/api-utils'

interface AdminSendMessageBody {
  message?: string
}

// GET /api/admin/support/tickets/:id/messages — list messages (admin)
// POST /api/admin/support/tickets/:id/messages — send admin reply
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { id: ticketId } = await params
  if (!ticketId) return errorResponse('Missing ticket id', 400)

  const { limit, offset } = getPagination(req, 100)

  const { data: messages, error, count } = await auth.adminDb
    .from('support_messages')
    .select('id, ticket_id, sender_profile_id, sender_type, message, created_at, sender:profiles!sender_profile_id(id, full_name, avatar_url)', { count: 'exact' })
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[Admin Support] list messages error:', error)
    return errorResponse('Failed to fetch messages', 500)
  }

  // Add sender_name to each message for agent name display
  const messagesWithName = (messages || []).map(msg => ({
    ...msg,
    sender_name: Array.isArray(msg.sender) && msg.sender.length > 0 ? msg.sender[0].full_name : null
  }))

  return jsonResponse({
    messages: messagesWithName,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { id: ticketId } = await params
  if (!ticketId) return errorResponse('Missing ticket id', 400)

  const body = await parseBody<AdminSendMessageBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const msg = (body.message || '').toString().trim()
  if (!msg) return errorResponse('Message is required', 400)

  const { data: ticket } = await auth.adminDb
    .from('support_tickets')
    .select('id, status')
    .eq('id', ticketId)
    .single()

  if (!ticket) return errorResponse('Ticket not found', 404)
  if (ticket.status === 'Closed') return errorResponse('Ticket is closed', 400)

  const now = new Date().toISOString()

  const { data: created, error } = await auth.adminDb
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      sender_profile_id: auth.profile.id,
      sender_type: 'admin',
      message: msg.slice(0, 4000),
      created_at: now,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Admin Support] send message error:', error)
    return errorResponse('Failed to send message', 500)
  }

  await auth.adminDb
    .from('support_tickets')
    .update({ last_message_at: now, updated_at: now, status: 'Pending' })
    .eq('id', ticketId)

  return jsonResponse({ message: created })
}
