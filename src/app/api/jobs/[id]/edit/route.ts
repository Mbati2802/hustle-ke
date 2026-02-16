import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { validate } from '@/lib/validation'
import { sendNotification } from '@/lib/notifications'

// PUT /api/jobs/[id]/edit — Edit a job (only for Open jobs)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const jobId = params.id
  const body = await parseBody<{
    title?: string
    description?: string
    budget_min?: number
    budget_max?: number
    deadline?: string
    category?: string
    location_preference?: string
    remote_allowed?: boolean
    skills_required?: string[]
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  // Verify the job exists and is editable
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, title, organization_id')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Open') return errorResponse('Only open jobs can be edited', 400)

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
    return errorResponse('Only the client can edit this job', 403)
  }

  // Validate the data
  const validationRules = {
    title: { required: false, type: 'string', min: 3, max: 200 },
    description: { required: false, type: 'string', min: 10, max: 5000 },
    budget_min: { required: false, type: 'number', min: 1000 },
    budget_max: { required: false, type: 'number', min: 1000 },
    category: { required: false, type: 'string', max: 50 },
    location_preference: { required: false, type: 'string', max: 100 },
    skills_required: { required: false, type: 'array', maxItems: 10 },
  }

  const result = validate(body, validationRules)
  if (!result.success) {
    return errorResponse('Validation failed', 400)
  }

  // Additional validation: budget_max must be >= budget_min if both provided
  if (body.budget_min && body.budget_max && body.budget_max < body.budget_min) {
    return errorResponse('Maximum budget must be greater than or equal to minimum budget', 400)
  }

  // Prepare update data
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  // Only include fields that are being updated
  if (body.title !== undefined) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.budget_min !== undefined) updateData.budget_min = body.budget_min
  if (body.budget_max !== undefined) updateData.budget_max = body.budget_max
  if (body.deadline !== undefined) updateData.deadline = body.deadline
  if (body.category !== undefined) updateData.category = body.category
  if (body.location_preference !== undefined) updateData.location_preference = body.location_preference
  if (body.remote_allowed !== undefined) updateData.remote_allowed = body.remote_allowed
  if (body.skills_required !== undefined) updateData.skills_required = body.skills_required

  // Update the job
  const { data: updatedJob, error } = await auth.adminDb
    .from('jobs')
    .update(updateData)
    .eq('id', jobId)
    .select()
    .single()

  if (error) return errorResponse('Failed to update job', 500)

  // Notify organization members if it's an org job
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)

    if (members) {
      const clientName = auth.profile.full_name || 'A client'
      for (const mem of members) {
        if (mem.user_id !== auth.profile.id) {
          await sendNotification(auth.adminDb, {
            userId: mem.user_id,
            type: 'system',
            title: 'Job Updated',
            message: `${clientName} updated the job "${updatedJob.title}".`,
            link: '/dashboard/projects',
          })
        }
      }
    }
  }

  return jsonResponse({ 
    success: true, 
    message: 'Job updated successfully',
    job: updatedJob
  })
}
