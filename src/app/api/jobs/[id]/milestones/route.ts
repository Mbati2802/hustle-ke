import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/jobs/[id]/milestones — Get job milestones
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const jobId = params.id

  // Verify job exists and user has access
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, organization_id')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Check permissions
  let hasAccess = job.client_id === auth.profile.id
  if (!hasAccess && job.organization_id) {
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (mem) hasAccess = true
  }
  if (!hasAccess) {
    // Check if freelancer is accepted on this job
    const { data: proposal } = await auth.adminDb
      .from('proposals')
      .select('id')
      .eq('job_id', jobId)
      .eq('freelancer_id', auth.profile.id)
      .eq('status', 'Accepted')
      .single()
    if (proposal) hasAccess = true
  }

  if (!hasAccess) return errorResponse('Access denied', 403)

  const { data: milestones, error } = await auth.supabase
    .from('job_milestones')
    .select('*')
    .eq('job_id', jobId)
    .order('order_index', { ascending: true })

  if (error) return errorResponse('Failed to fetch milestones', 500)

  return jsonResponse({ milestones })
}

// POST /api/jobs/[id]/milestones — Create milestone
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const jobId = params.id
  const body = await parseBody<{
    title: string
    description?: string
    amount: number
    due_date?: string
    order_index?: number
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  // Verify job exists and user is client
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, organization_id, milestones_enabled')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (!job.milestones_enabled) return errorResponse('Milestones not enabled for this job', 400)

  // Check permissions
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
    return errorResponse('Only the client can create milestones', 403)
  }

  // Validate amount
  if (!body.amount || body.amount <= 0) {
    return errorResponse('Amount must be greater than 0', 400)
  }

  // Create milestone
  const { data: milestone, error } = await auth.supabase
    .from('job_milestones')
    .insert({
      job_id: jobId,
      title: body.title,
      description: body.description,
      amount: body.amount,
      due_date: body.due_date,
      order_index: body.order_index || 0,
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to create milestone', 500)

  return jsonResponse({ milestone }, 201)
}
