import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// PUT /api/milestones/[id] — Update milestone status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const milestoneId = params.id
  const body = await parseBody<{
    status?: string
    completed_at?: string
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  // Get milestone with job details
  const { data: milestone, error: fetchError } = await auth.adminDb
    .from('job_milestones')
    .select(`
      *,
      job:jobs!job_id(id, title, client_id, organization_id, milestones_enabled)
    `)
    .eq('id', milestoneId)
    .single()

  if (fetchError || !milestone) return errorResponse('Milestone not found', 404)

  // Check permissions
  let hasAccess = milestone.job.client_id === auth.profile.id
  if (!hasAccess && milestone.job.organization_id) {
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', milestone.job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (mem) hasAccess = true
  }

  // Freelancers can mark milestones as completed
  if (!hasAccess && body.status === 'Completed') {
    const { data: proposal } = await auth.adminDb
      .from('proposals')
      .select('id')
      .eq('job_id', milestone.job_id)
      .eq('freelancer_id', auth.profile.id)
      .eq('status', 'Accepted')
      .single()
    if (proposal) hasAccess = true
  }

  if (!hasAccess) return errorResponse('Access denied', 403)

  // Update milestone
  const updateData: any = { updated_at: new Date().toISOString() }
  if (body.status) updateData.status = body.status
  if (body.completed_at) updateData.completed_at = body.completed_at
  if (body.status === 'Completed' && !body.completed_at) {
    updateData.completed_at = new Date().toISOString()
  }

  const { data: updatedMilestone, error } = await auth.supabase
    .from('job_milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) return errorResponse('Failed to update milestone', 500)

  // If milestone is completed, notify client
  if (body.status === 'Completed') {
    await sendNotification(auth.adminDb, {
      userId: milestone.job.client_id,
      type: 'system',
      title: 'Milestone Completed',
      message: `Milestone "${milestone.title}" for job "${milestone.job.title}" has been completed.`,
      link: '/dashboard/projects',
    })

    // Notify organization members if it's an org job
    if (milestone.job.organization_id) {
      const { data: members } = await auth.adminDb
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', milestone.job.organization_id)

      if (members) {
        for (const mem of members) {
          if (mem.user_id !== milestone.job.client_id) {
            await sendNotification(auth.adminDb, {
              userId: mem.user_id,
              type: 'system',
              title: 'Milestone Completed',
              message: `Milestone "${milestone.title}" has been completed.`,
              link: '/dashboard/projects',
            })
          }
        }
      }
    }

    // Notify freelancer
    const { data: proposal } = await auth.adminDb
      .from('proposals')
      .select('freelancer_id')
      .eq('job_id', milestone.job_id)
      .eq('status', 'Accepted')
      .single()

    if (proposal) {
      await sendNotification(auth.adminDb, {
        userId: proposal.freelancer_id,
        type: 'system',
        title: 'Milestone Completed',
        message: `Milestone "${milestone.title}" has been completed.`,
        link: '/dashboard/jobs',
      })
    }
  }

  return jsonResponse({ milestone: updatedMilestone })
}
