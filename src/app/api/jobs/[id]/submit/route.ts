import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { notifyWorkSubmitted } from '@/lib/notifications'

interface SubmissionFile {
  name: string
  size: number
  type: string
  path: string
  url: string | null
}

// POST /api/jobs/[id]/submit — Freelancer submits work for review
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Only freelancers can submit work
  if (auth.profile.role !== 'Freelancer' && auth.profile.role !== 'Admin') {
    return errorResponse('Only freelancers can submit work', 403)
  }

  // Verify the job exists and is In-Progress
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, title, client_id, status, organization_id')
    .eq('id', params.id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'In-Progress') {
    return errorResponse('Work can only be submitted for jobs that are In-Progress', 400)
  }

  // Verify the freelancer has an accepted proposal for this job
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id')
    .eq('job_id', params.id)
    .eq('freelancer_id', auth.profile.id)
    .eq('status', 'Accepted')
    .single()

  if (!proposal) {
    return errorResponse('You must be the hired freelancer to submit work', 403)
  }

  const body = await parseBody(req)
  const payload = body as Record<string, unknown> | null

  // Build structured submission details
  const submissionDetails = {
    description: (payload?.description as string) || '',
    deliverables: (payload?.deliverables as string) || '',
    notes: (payload?.notes as string) || '',
    files: (payload?.files as SubmissionFile[]) || [],
    submitted_at: new Date().toISOString(),
    submitted_by: auth.profile.id,
    freelancer_name: auth.profile.full_name || 'Freelancer',
  }

  // Update job status to Review and store submission details
  const { data: updated, error } = await auth.adminDb
    .from('jobs')
    .update({
      status: 'Review',
      submission_details: submissionDetails,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Submit work - update job status error:', error)
    return errorResponse('Failed to submit work', 500)
  }

  // Send notification message to the client with a clickable review link
  const freelancerName = auth.profile.full_name || 'The freelancer'
  const msgContent = `${freelancerName} has submitted work for "${job.title}". Please review it on your Projects page.\n\n[REVIEW_WORK:/dashboard/projects]`
  await auth.adminDb
    .from('messages')
    .insert({
      job_id: params.id,
      sender_id: auth.profile.id,
      receiver_id: job.client_id,
      content: msgContent,
    })

  // Send site/email/SMS notification to the client
  notifyWorkSubmitted(auth.adminDb, job.client_id, freelancerName, job.title).catch(console.error)

  // For org jobs, also notify all org members
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)
    if (members) {
      for (const m of members) {
        if (m.user_id !== job.client_id) {
          notifyWorkSubmitted(auth.adminDb, m.user_id, freelancerName, job.title).catch(console.error)
        }
      }
    }
  }

  return jsonResponse({
    job: updated,
    message: 'Work submitted for review. The client will review and approve or request revisions.',
  })
}
