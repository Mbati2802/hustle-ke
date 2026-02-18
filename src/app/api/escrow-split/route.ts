import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'

// GET /api/escrow-split?job_id=xxx — Get milestones for a job
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')

  if (!jobId) return errorResponse('job_id required', 400)

  // Get job to verify access
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, title, client_id, status, budget_min, budget_max, milestones_enabled')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Get milestones
  const { data: milestones } = await auth.adminDb
    .from('job_milestones')
    .select('*')
    .eq('job_id', jobId)
    .order('order_index', { ascending: true })

  // Get milestone payments
  const { data: payments } = await auth.adminDb
    .from('milestone_payments')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })

  // Calculate summary
  const totalBudget = (milestones || []).reduce((s, m) => s + Number(m.amount || 0), 0)
  const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
  const completedMilestones = (milestones || []).filter(m => ['Completed', 'Paid'].includes(m.status)).length

  return jsonResponse({
    job: { id: job.id, title: job.title, status: job.status, milestones_enabled: job.milestones_enabled },
    milestones: milestones || [],
    payments: payments || [],
    summary: {
      totalBudget,
      totalPaid,
      remaining: totalBudget - totalPaid,
      completedMilestones,
      totalMilestones: (milestones || []).length,
      progressPercent: (milestones || []).length > 0 ? Math.round((completedMilestones / (milestones || []).length) * 100) : 0,
    },
  })
}

// POST /api/escrow-split — Manage milestones
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: string
    job_id?: string
    milestone_id?: string
    milestones?: Array<{
      title: string
      description?: string
      amount: number
      percentage: number
      due_date?: string
      auto_release_hours?: number
    }>
    submission_note?: string
    submission_files?: Array<{ name: string; url: string; size: number }>
    review_note?: string
    partial_approval_pct?: number
    revision_note?: string
  }>(req)

  if (!body?.action) return errorResponse('Action required', 400)

  // Create milestones for a job
  if (body.action === 'create') {
    const { job_id, milestones } = body
    if (!job_id || !milestones || milestones.length === 0) {
      return errorResponse('job_id and milestones array required', 400)
    }

    // Verify job ownership
    const { data: job } = await auth.adminDb
      .from('jobs')
      .select('id, client_id, budget_min, budget_max')
      .eq('id', job_id)
      .single()

    if (!job) return errorResponse('Job not found', 404)
    if (job.client_id !== auth.profile.id) return errorResponse('Only the job owner can create milestones', 403)

    // Validate percentages sum to 100
    const totalPct = milestones.reduce((s, m) => s + m.percentage, 0)
    if (Math.abs(totalPct - 100) > 1) {
      return errorResponse(`Milestone percentages must sum to 100% (currently ${totalPct}%)`, 400)
    }

    // Create milestones
    const milestoneRows = milestones.map((m, i) => ({
      job_id,
      title: m.title,
      description: m.description || null,
      amount: m.amount,
      percentage: m.percentage,
      due_date: m.due_date || null,
      auto_release_hours: m.auto_release_hours || 72,
      order_index: i,
      status: 'Pending',
    }))

    const { data: created, error } = await auth.adminDb
      .from('job_milestones')
      .insert(milestoneRows)
      .select('*')

    if (error) {
      console.error('Milestone creation error:', error)
      return errorResponse('Failed to create milestones', 500)
    }

    // Enable milestones on the job
    await auth.adminDb
      .from('jobs')
      .update({ milestones_enabled: true })
      .eq('id', job_id)

    return jsonResponse({ milestones: created })
  }

  // Freelancer submits a milestone for review
  if (body.action === 'submit') {
    const { milestone_id, submission_note, submission_files } = body
    if (!milestone_id) return errorResponse('milestone_id required', 400)

    const { data: milestone } = await auth.adminDb
      .from('job_milestones')
      .select('*, job:jobs(client_id)')
      .eq('id', milestone_id)
      .single()

    if (!milestone) return errorResponse('Milestone not found', 404)

    // Update milestone
    const now = new Date()
    const autoReleaseAt = new Date(now.getTime() + (milestone.auto_release_hours || 72) * 60 * 60 * 1000)

    const { error } = await auth.adminDb
      .from('job_milestones')
      .update({
        status: 'Submitted',
        submitted_at: now.toISOString(),
        submission_note: submission_note || null,
        submission_files: submission_files || [],
        auto_release_at: autoReleaseAt.toISOString(),
        revision_requested: false,
      })
      .eq('id', milestone_id)

    if (error) return errorResponse('Failed to submit milestone', 500)

    return jsonResponse({
      success: true,
      auto_release_at: autoReleaseAt.toISOString(),
      message: `Milestone submitted! The client has ${milestone.auto_release_hours || 72} hours to review before auto-release.`,
    })
  }

  // Client approves a milestone (full or partial)
  if (body.action === 'approve') {
    const { milestone_id, review_note, partial_approval_pct } = body
    if (!milestone_id) return errorResponse('milestone_id required', 400)

    const { data: milestone } = await auth.adminDb
      .from('job_milestones')
      .select('*, job:jobs(client_id)')
      .eq('id', milestone_id)
      .single()

    if (!milestone) return errorResponse('Milestone not found', 404)

    const isPartial = partial_approval_pct && partial_approval_pct < 100
    const approvalPct = isPartial ? partial_approval_pct : 100
    const releaseAmount = Number(milestone.amount) * (approvalPct / 100)

    // Update milestone status
    await auth.adminDb
      .from('job_milestones')
      .update({
        status: isPartial ? 'Partially Approved' : 'Approved',
        review_note: review_note || null,
        partial_approval_pct: approvalPct,
        completed_at: new Date().toISOString(),
        auto_release_at: null, // Cancel auto-release
      })
      .eq('id', milestone_id)

    return jsonResponse({
      success: true,
      status: isPartial ? 'Partially Approved' : 'Approved',
      release_amount: releaseAmount,
      message: isPartial
        ? `Milestone ${approvalPct}% approved. KES ${releaseAmount.toLocaleString()} will be released.`
        : `Milestone fully approved! KES ${releaseAmount.toLocaleString()} released to freelancer.`,
    })
  }

  // Client requests revision
  if (body.action === 'request-revision') {
    const { milestone_id, revision_note } = body
    if (!milestone_id || !revision_note) {
      return errorResponse('milestone_id and revision_note required', 400)
    }

    await auth.adminDb
      .from('job_milestones')
      .update({
        status: 'Revision Requested',
        revision_requested: true,
        revision_note,
        auto_release_at: null, // Cancel auto-release during revision
      })
      .eq('id', milestone_id)

    return jsonResponse({
      success: true,
      message: 'Revision requested. The freelancer will be notified.',
    })
  }

  // Update milestone details (client only, before work starts)
  if (body.action === 'update') {
    const { milestone_id } = body
    if (!milestone_id) return errorResponse('milestone_id required', 400)

    const milestoneData = body.milestones?.[0]
    if (!milestoneData) return errorResponse('Milestone data required', 400)

    const { data: existing } = await auth.adminDb
      .from('job_milestones')
      .select('status')
      .eq('id', milestone_id)
      .single()

    if (!existing) return errorResponse('Milestone not found', 404)
    if (!['Pending', 'In Progress'].includes(existing.status)) {
      return errorResponse('Can only edit milestones that are Pending or In Progress', 400)
    }

    const updates: Record<string, unknown> = {}
    if (milestoneData.title) updates.title = milestoneData.title
    if (milestoneData.description !== undefined) updates.description = milestoneData.description
    if (milestoneData.amount) updates.amount = milestoneData.amount
    if (milestoneData.percentage) updates.percentage = milestoneData.percentage
    if (milestoneData.due_date) updates.due_date = milestoneData.due_date
    if (milestoneData.auto_release_hours) updates.auto_release_hours = milestoneData.auto_release_hours

    await auth.adminDb
      .from('job_milestones')
      .update(updates)
      .eq('id', milestone_id)

    return jsonResponse({ success: true })
  }

  return errorResponse('Invalid action. Use: create, submit, approve, request-revision, update', 400)
}
