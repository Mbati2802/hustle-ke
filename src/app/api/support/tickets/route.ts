import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody, getPagination } from '@/lib/api-utils'

interface CreateTicketBody {
  subject?: string
  category?: string
  sub_category?: string
  urgency?: 'low' | 'medium' | 'high'
  message?: string
}

// POST /api/support/tickets — create support ticket for current user
// GET /api/support/tickets — list my tickets
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<CreateTicketBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const subject = (body.subject || 'Live Chat Support').toString().trim().slice(0, 120)
  const category = (body.category || 'general').toString().trim().slice(0, 64)
  const subCategory = (body.sub_category || 'general').toString().trim().slice(0, 64)
  const urgency = (body.urgency || 'low')
  const firstMessage = (body.message || '').toString().trim().slice(0, 4000)

  if (!subject) return errorResponse('Subject is required', 400)
  if (!['low', 'medium', 'high'].includes(urgency)) return errorResponse('Invalid urgency', 400)

  const now = new Date().toISOString()

  const { data: ticket, error: tErr } = await auth.adminDb
    .from('support_tickets')
    .insert({
      user_id: auth.profile.id,
      subject,
      category,
      sub_category: subCategory,
      urgency,
      status: 'Open',
      last_message_at: now,
    })
    .select('*')
    .single()

  if (tErr || !ticket) {
    console.error('[Support] create ticket error:', tErr)
    return errorResponse('Failed to create support ticket', 500)
  }

  if (firstMessage) {
    const { error: mErr } = await auth.adminDb
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_profile_id: auth.profile.id,
        sender_type: 'user',
        message: firstMessage,
        created_at: now,
      })

    if (mErr) {
      console.error('[Support] create ticket message error:', mErr)
    }
  }

  return jsonResponse({ ticket })
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req, 20)

  const { data: tickets, error, count } = await auth.adminDb
    .from('support_tickets')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.profile.id)
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[Support] list tickets error:', error)
    return errorResponse('Failed to fetch support tickets', 500)
  }

  return jsonResponse({
    tickets: tickets || [],
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
