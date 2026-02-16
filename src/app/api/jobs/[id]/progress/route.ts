import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/jobs/[id]/progress — Freelancer updates work or revision progress
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (auth.profile.role !== 'Freelancer' && auth.profile.role !== 'Admin') {
    return errorResponse('Only freelancers can update progress', 403)
  }

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const payload = body as Record<string, unknown>
  const type = payload.type as string // 'work' or 'revision'
  const progress = Number(payload.progress)

  if (!['work', 'revision'].includes(type)) {
    return errorResponse('Type must be "work" or "revision"', 400)
  }
  if (isNaN(progress) || progress < 0 || progress > 100) {
    return errorResponse('Progress must be between 0 and 100', 400)
  }

  // Verify the job exists and freelancer is hired
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, title, client_id, status, work_progress, revision_progress')
    .eq('id', params.id)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Verify freelancer has accepted proposal
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id')
    .eq('job_id', params.id)
    .eq('freelancer_id', auth.profile.id)
    .eq('status', 'Accepted')
    .single()

  if (!proposal) {
    return errorResponse('You must be the hired freelancer', 403)
  }

  // Only allow progress updates for In-Progress jobs
  if (job.status !== 'In-Progress') {
    return errorResponse('Progress can only be updated for In-Progress jobs', 400)
  }

  const column = type === 'work' ? 'work_progress' : 'revision_progress'
  const oldProgress = type === 'work' ? (job.work_progress || 0) : (job.revision_progress || 0)

  // Update progress
  const { data: updated, error } = await auth.adminDb
    .from('jobs')
    .update({ [column]: progress })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('Progress update error:', error)
    return errorResponse('Failed to update progress', 500)
  }

  // Send message to client when progress changes by 10% or more, or hits milestones
  const diff = Math.abs(progress - oldProgress)
  const milestones = [25, 50, 75, 100]
  const hitMilestone = milestones.some(m => progress >= m && oldProgress < m)

  if (diff >= 10 || hitMilestone) {
    const label = type === 'work' ? 'Work' : 'Revision'
    const freelancerName = auth.profile.full_name || 'The freelancer'
    let emoji = '📊'
    if (progress === 100) emoji = '✅'
    else if (progress >= 75) emoji = '🟢'
    else if (progress >= 50) emoji = '🟡'
    else if (progress >= 25) emoji = '🔵'

    await auth.adminDb
      .from('messages')
      .insert({
        job_id: params.id,
        sender_id: auth.profile.id,
        receiver_id: job.client_id,
        content: `${emoji} ${label} Progress Update: ${progress}%\n\n${freelancerName} has updated the ${label.toLowerCase()} progress for "${job.title}" to ${progress}%.${progress === 100 ? '\n\nThe work is ready for submission!' : ''}`,
      })
  }

  return jsonResponse({ job: updated })
}

// GET /api/jobs/[id]/progress — Get progress for a job
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, work_progress, revision_progress, status')
    .eq('id', params.id)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  return jsonResponse({
    work_progress: job.work_progress || 0,
    revision_progress: job.revision_progress || 0,
    status: job.status,
  })
}
