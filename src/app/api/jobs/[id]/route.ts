import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody, createPublicRouteClient } from '@/lib/api-utils'
import { validate, jobCreateSchema } from '@/lib/validation'
import { recalculateHustleScore } from '@/lib/subscription-utils'

// GET /api/jobs/[id] — Get single job (public)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const { data: job, error } = await supabase!
    .from('jobs')
    .select('*, client:profiles!client_id(id, full_name, avatar_url, verification_status, hustle_score, location, county), organization:organizations!organization_id(id, name, logo_url)')
    .eq('id', params.id)
    .single()

  if (error || !job) {
    console.error('[Job Detail] Not found:', params.id, error)
    return errorResponse('Job not found', 404)
  }

  // Log client data for debugging
  if (job.client) {
    console.log('[Job Detail] Job:', job.id, 'client_id:', job.client_id, 'client.id:', job.client.id, 'client.full_name:', job.client.full_name)
  } else {
    console.warn('[Job Detail] Job:', job.id, 'has client_id:', job.client_id, 'but no client profile joined')
  }

  // Increment views
  await supabase!
    .from('jobs')
    .update({ views_count: (job.views_count || 0) + 1 })
    .eq('id', params.id)

  return jsonResponse({ job })
}

// PUT /api/jobs/[id] — Update job (owner only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Verify ownership
  const { data: existingJob } = await auth.supabase
    .from('jobs')
    .select('id, client_id, status, proposals_count, organization_id')
    .eq('id', params.id)
    .single()

  if (!existingJob) return errorResponse('Job not found', 404)
  let canEdit = existingJob.client_id === auth.profile.id || auth.profile.role === 'Admin'
  if (!canEdit && existingJob.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members').select('role')
      .eq('organization_id', existingJob.organization_id)
      .eq('user_id', auth.profile.id).in('role', ['owner', 'admin']).single()
    if (membership) canEdit = true
  }
  if (!canEdit) {
    return errorResponse('You can only edit your own jobs', 403)
  }

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  // If job has proposals, only allow status changes (no content edits)
  const hasProposals = (existingJob.proposals_count || 0) > 0
  const isStatusOnlyUpdate = Object.keys(body).length === 1 && body.status !== undefined
  if (hasProposals && !isStatusOnlyUpdate && auth.profile.role !== 'Admin') {
    return errorResponse('Cannot edit a job that already has proposals. You can only change its status.', 400)
  }

  // Allow status updates
  const updateSchema = {
    ...jobCreateSchema,
    status: { enum: ['Draft', 'Open', 'In-Progress', 'Review', 'Completed', 'Cancelled'] as const },
  }

  const result = validate<Record<string, unknown>>(body, updateSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  const allowedFields = [...Object.keys(jobCreateSchema), 'status']
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (result.data[key] !== undefined) {
      updateData[key] = result.data[key]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('No valid fields to update')
  }

  const { data: updated, error } = await auth.supabase
    .from('jobs')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update job', 500)

  // When job status changes to 'Completed', increment freelancer's jobs_completed
  if (updateData.status === 'Completed' && existingJob.status !== 'Completed') {
    const { data: acceptedProposal } = await auth.adminDb
      .from('proposals')
      .select('freelancer_id')
      .eq('job_id', params.id)
      .eq('status', 'Accepted')
      .single()

    if (acceptedProposal) {
      const { data: fp } = await auth.adminDb
        .from('profiles')
        .select('jobs_completed')
        .eq('id', acceptedProposal.freelancer_id)
        .single()

      if (fp) {
        await auth.adminDb
          .from('profiles')
          .update({ jobs_completed: (fp.jobs_completed || 0) + 1 })
          .eq('id', acceptedProposal.freelancer_id)
      }

      await recalculateHustleScore(auth.adminDb, acceptedProposal.freelancer_id, 'job_completed')
    }
  }

  return jsonResponse({ job: updated })
}

// DELETE /api/jobs/[id] — Delete job (owner or admin, only Draft/Open)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: job } = await auth.supabase
    .from('jobs')
    .select('id, client_id, status, organization_id')
    .eq('id', params.id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  let canDelete = job.client_id === auth.profile.id || auth.profile.role === 'Admin'
  if (!canDelete && job.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members').select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id).in('role', ['owner', 'admin']).single()
    if (membership) canDelete = true
  }
  if (!canDelete) {
    return errorResponse('You can only delete your own jobs', 403)
  }
  if (!['Draft', 'Open'].includes(job.status)) {
    return errorResponse('Can only delete Draft or Open jobs', 400)
  }

  const { error } = await auth.supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)

  if (error) return errorResponse('Failed to delete job', 500)

  return jsonResponse({ message: 'Job deleted successfully' })
}
