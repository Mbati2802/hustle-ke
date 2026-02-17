import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/support/tickets/[id]/status — Get ticket status for resolution feedback
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const ticketId = params.id

  const { data: ticket, error } = await auth.adminDb
    .from('support_tickets')
    .select('id, status, assigned_to, satisfaction_rating, agent_review_rating')
    .eq('id', ticketId)
    .eq('user_id', auth.profile.id)
    .single()

  if (error || !ticket) {
    return errorResponse('Ticket not found', 404)
  }

  return jsonResponse({ ticket })
}

// PUT /api/support/tickets/[id]/status — Submit satisfaction rating and review/dispute
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const ticketId = params.id
  const body = await req.json().catch(() => ({}))

  const {
    satisfaction_rating,
    satisfaction_comment,
    agent_review_rating,
    agent_review_comment,
  } = body

  // Verify ticket ownership
  const { data: ticket, error: fetchError } = await auth.adminDb
    .from('support_tickets')
    .select('id, user_id, assigned_to')
    .eq('id', ticketId)
    .eq('user_id', auth.profile.id)
    .single()

  if (fetchError || !ticket) {
    return errorResponse('Ticket not found', 404)
  }

  // Update satisfaction rating
  const updates: any = {}
  if (satisfaction_rating) {
    updates.satisfaction_rating = satisfaction_rating
    updates.satisfaction_comment = satisfaction_comment || null
  }

  if (agent_review_rating && ticket.assigned_to) {
    updates.agent_review_rating = agent_review_rating
    updates.agent_review_comment = agent_review_comment || null

    // Create review for the assigned agent
    await auth.adminDb.from('reviews').insert({
      reviewer_id: auth.profile.id,
      reviewee_id: ticket.assigned_to,
      rating: agent_review_rating,
      comment: agent_review_comment || '',
      job_id: null, // Support ticket reviews don't have job_id
      created_at: new Date().toISOString(),
    })

    // Send system message to admin about the review
    await auth.adminDb.from('support_messages').insert({
      ticket_id: ticketId,
      sender_profile_id: auth.profile.id,
      sender_type: 'system',
      message: `User submitted a ${agent_review_rating}-star review${agent_review_comment ? `: "${agent_review_comment}"` : '.'}`,
      created_at: new Date().toISOString(),
    })

    // Notify the assigned agent
    await auth.adminDb.from('notifications').insert({
      user_id: ticket.assigned_to,
      type: 'support_review',
      title: `${agent_review_rating}⭐ Review Received`,
      message: `You received a ${agent_review_rating}-star review for ticket ${ticketId}`,
      link: `/admin/support?ticket=${ticketId}`,
    })
  }

  const { error: updateError } = await auth.adminDb
    .from('support_tickets')
    .update(updates)
    .eq('id', ticketId)

  if (updateError) {
    console.error('[Support Ticket] update error:', updateError)
    return errorResponse('Failed to update ticket', 500)
  }

  return jsonResponse({ success: true })
}
