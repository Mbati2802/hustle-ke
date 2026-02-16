import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// POST /api/jobs/[id]/close — Close a job to stop receiving proposals
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const jobId = params.id
  const body = await parseBody<{ reason?: string }>(req)

  // Verify the job exists and is open
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, title, organization_id')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Open') return errorResponse('Only open jobs can be closed', 400)

  // Verify the requester is the client (or org member)
  let isClient = job.client_id === auth.profile.id
  if (!isClient && job.organization_id) {
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (mem) isClient = true
  }

  if (!isClient && auth.profile.role !== 'Admin') {
    return errorResponse('Only the client can close this job', 403)
  }

  // Update job status to Closed
  const { error: jobError } = await auth.adminDb
    .from('jobs')
    .update({ 
      status: 'Closed',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (jobError) return errorResponse('Failed to close job', 500)

  // Notify pending proposal applicants
  const { data: pendingProposals } = await auth.adminDb
    .from('proposals')
    .select('freelancer_id')
    .eq('job_id', jobId)
    .eq('status', 'Pending')

  if (pendingProposals && pendingProposals.length > 0) {
    const clientName = auth.profile.full_name || 'A client'
    
    for (const proposal of pendingProposals) {
      await sendNotification(auth.adminDb, {
        userId: proposal.freelancer_id,
        type: 'system',
        title: 'Job Closed',
        message: `${clientName} closed the job "${job.title}". Your proposal will no longer be considered.`,
        link: '/dashboard/proposals',
      })
    }
  }

  // Notify organization members if it's an org job
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)

    if (members) {
      for (const mem of members) {
        if (mem.user_id !== auth.profile.id) {
          await sendNotification(auth.adminDb, {
            userId: mem.user_id,
            type: 'system',
            title: 'Job Closed',
            message: `The job "${job.title}" has been closed.`,
            link: '/dashboard/projects',
          })
        }
      }
    }
  }

  return jsonResponse({ 
    success: true, 
    message: 'Job closed successfully',
    notifiedApplicants: pendingProposals?.length || 0
  })
}
