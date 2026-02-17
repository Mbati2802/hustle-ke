import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/support/disputes — Create a support-related dispute
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    ticket_id: string
    title: string
    description: string
    chat_evidence: string
  }>(req)

  if (!body) return errorResponse('Invalid request body')
  if (!body.ticket_id || !body.title || !body.description) {
    return errorResponse('ticket_id, title, and description are required')
  }

  // Verify ticket exists and belongs to user
  const { data: ticket } = await auth.supabase
    .from('support_tickets')
    .select('id, user_id, assigned_to')
    .eq('id', body.ticket_id)
    .single()

  if (!ticket) return errorResponse('Support ticket not found', 404)
  if (ticket.user_id !== auth.profile.id) {
    return errorResponse('You can only dispute your own support tickets', 403)
  }

  // Create support dispute (no job_id or escrow_id for support tickets)
  const { data, error } = await auth.supabase
    .from('disputes')
    .insert({
      initiator_id: auth.profile.id,
      respondent_id: ticket.assigned_to || null, // Dispute against assigned agent
      job_id: null, // Support disputes don't have jobs
      escrow_id: null, // Support disputes don't have escrow
      reason: body.title,
      description: body.description,
      evidence_urls: [], // Chat evidence is in description
      status: 'Open',
      category: 'Support', // Mark as support-related
    })
    .select()

  if (error || !data || data.length === 0) {
    console.error('[Support Dispute] Create error:', error)
    return errorResponse('Failed to create dispute', 500)
  }

  const dispute = data[0]

  // Link dispute to support ticket
  await auth.supabase
    .from('support_tickets')
    .update({ related_dispute_id: dispute.id })
    .eq('id', body.ticket_id)

  // Notify admins about the support dispute
  const { data: admins } = await auth.supabase
    .from('profiles')
    .select('id')
    .eq('role', 'Admin')

  if (admins && admins.length > 0) {
    const notifications = admins.map(admin => ({
      user_id: admin.id,
      type: 'support_dispute',
      title: 'New Support Dispute',
      message: `User filed a dispute for support ticket ${body.ticket_id}`,
      link: `/admin/disputes?id=${dispute.id}`,
    }))

    await auth.supabase.from('notifications').insert(notifications)
  }

  return jsonResponse({ dispute }, 201)
}
