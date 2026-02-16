import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination, parseBody } from '@/lib/api-utils'

interface UpdateTicketBody {
  action?: 'assign' | 'close' | 'resolve' | 'reopen'
  assigned_admin_id?: string | null
}

// GET /api/admin/support/tickets — list all tickets (admin)
// PUT /api/admin/support/tickets — update ticket state (admin)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const urgency = url.searchParams.get('urgency')
  const assigned = url.searchParams.get('assigned')

  const { limit, offset } = getPagination(req, 20)

  let q = auth.adminDb
    .from('support_tickets')
    .select('*, user:profiles!user_id(id, full_name, email, avatar_url), assigned_admin:profiles!assigned_admin_id(id, full_name, email, avatar_url)', { count: 'exact' })
    .order('last_message_at', { ascending: false })

  if (status) q = q.eq('status', status)
  if (urgency) q = q.eq('urgency', urgency)
  if (assigned === 'me') q = q.eq('assigned_admin_id', auth.profile.id)
  if (assigned === 'unassigned') q = q.is('assigned_admin_id', null)

  const { data: tickets, error, count } = await q.range(offset, offset + limit - 1)

  if (error) {
    console.error('[Admin Support] list tickets error:', error)
    return errorResponse('Failed to fetch support tickets', 500)
  }

  return jsonResponse({
    tickets: tickets || [],
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<UpdateTicketBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const url = new URL(req.url)
  const ticketId = url.searchParams.get('id')
  if (!ticketId) return errorResponse('Missing ticket id', 400)

  const action = body.action
  const now = new Date().toISOString()

  const patch: Record<string, any> = { updated_at: now }
  if (action === 'assign') {
    patch.assigned_admin_id = body.assigned_admin_id ?? auth.profile.id
    patch.status = 'Pending'
  } else if (action === 'close') {
    patch.status = 'Closed'
  } else if (action === 'resolve') {
    patch.status = 'Resolved'
  } else if (action === 'reopen') {
    patch.status = 'Open'
  } else {
    return errorResponse('Invalid action', 400)
  }

  const { data, error } = await auth.adminDb
    .from('support_tickets')
    .update(patch)
    .eq('id', ticketId)
    .select('*')
    .single()

  if (error) {
    console.error('[Admin Support] update ticket error:', error)
    return errorResponse('Failed to update ticket', 500)
  }

  return jsonResponse({ ticket: data })
}
