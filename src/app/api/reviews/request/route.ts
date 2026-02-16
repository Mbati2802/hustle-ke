import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// POST /api/reviews/request — Freelancer requests client/org to leave a review
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ job_id: string }>(req)
  if (!body?.job_id) return errorResponse('job_id is required')

  // Verify the job exists and is completed
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, title, status, organization_id')
    .eq('id', body.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Completed') return errorResponse('Job must be completed to request a review', 400)

  // Verify the requester is the freelancer on this job
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id, freelancer_id')
    .eq('job_id', body.job_id)
    .eq('status', 'Accepted')
    .single()

  if (!proposal || proposal.freelancer_id !== auth.profile.id) {
    return errorResponse('Only the hired freelancer can request a review', 403)
  }

  // Check if client already reviewed
  const { data: existingReview } = await auth.adminDb
    .from('reviews')
    .select('id')
    .eq('job_id', body.job_id)
    .eq('reviewee_id', auth.profile.id)
    .single()

  if (existingReview) {
    return errorResponse('The client has already reviewed you for this job', 409)
  }

  const freelancerName = auth.profile.full_name || 'A freelancer'

  // Send notification to client
  await sendNotification(auth.adminDb, {
    userId: job.client_id,
    type: 'review_request',
    title: 'Review Requested',
    message: `${freelancerName} has requested your review for "${job.title}". Your feedback helps build trust on the platform.`,
    link: '/dashboard/projects',
  })

  // If org job, notify all org members too
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)

    if (members) {
      for (const mem of members) {
        if (mem.user_id !== job.client_id) {
          await sendNotification(auth.adminDb, {
            userId: mem.user_id,
            type: 'review_request',
            title: 'Review Requested',
            message: `${freelancerName} has requested a review for "${job.title}". Please leave a review on your Projects page.`,
            link: '/dashboard/projects',
          })
        }
      }
    }
  }

  // Also send an in-chat message
  const { data: conversation } = await auth.adminDb
    .from('conversations')
    .select('id')
    .eq('job_id', body.job_id)
    .single()

  if (conversation) {
    await auth.adminDb.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: auth.profile.id,
      content: `Hi! I'd really appreciate it if you could leave a review for my work on "${job.title}". Your feedback helps me grow and build trust on the platform. Thank you! [REVIEW_REQUEST:${body.job_id}]`,
    })
  }

  return jsonResponse({ success: true, message: 'Review request sent' })
}
