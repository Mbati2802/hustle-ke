import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody, getPagination } from '@/lib/api-utils'
import { validate, proposalCreateSchema } from '@/lib/validation'
import { scanMessageContent } from '@/lib/content-filter'
import { getUserPlan, getTodayProposalCount } from '@/lib/subscription-utils'
import { notifyNewProposal } from '@/lib/notifications'

// GET /api/proposals — List current user's proposals
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const orgId = url.searchParams.get('organization_id')

  let query = auth.adminDb
    .from('proposals')
    .select('*, job:jobs!job_id(id, title, budget_min, budget_max, status, deadline, created_at, work_progress, revision_progress, client_id, organization_id, client:profiles!client_id(id, full_name, avatar_url)), freelancer:profiles!freelancer_id(id, full_name, avatar_url, title, hustle_score)', { count: 'exact' })

  // Org mode: show all proposals for org jobs; personal: show user's own proposals
  if (orgId) {
    // Fetch org job IDs first, then filter proposals by those jobs
    const { data: orgJobs } = await auth.adminDb
      .from('jobs')
      .select('id')
      .eq('organization_id', orgId)
    const orgJobIds = (orgJobs || []).map((j: { id: string }) => j.id)
    if (orgJobIds.length === 0) {
      return jsonResponse({ proposals: [], pagination: { total: 0, limit, offset, hasMore: false } })
    }
    query = query.in('job_id', orgJobIds)
  } else {
    query = query.eq('freelancer_id', auth.profile.id)
  }

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: proposals, error, count } = await query

  if (error) return errorResponse('Failed to fetch proposals', 500)

  return jsonResponse({
    proposals,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/proposals — Submit a proposal
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (auth.profile.role !== 'Freelancer' && auth.profile.role !== 'Admin') {
    return errorResponse('Only freelancers can submit proposals', 403)
  }

  // Enforce daily proposal limit based on plan (Free: 10, Pro: 20)
  const userPlan = await getUserPlan(auth.adminDb, auth.profile.id)
  const todayCount = await getTodayProposalCount(auth.adminDb, auth.profile.id)
  if (todayCount >= userPlan.max_proposals_per_day) {
    const planName = userPlan.plan === 'free' ? 'Free' : 'Pro'
    return errorResponse(
      `Daily proposal limit reached (${userPlan.max_proposals_per_day} per day on ${planName} plan).${userPlan.plan === 'free' ? ' Upgrade to Pro for 20 proposals per day.' : ''}`,
      429
    )
  }

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{
    job_id: string
    cover_letter: string
    bid_amount: number
    estimated_duration_days?: number
  }>(body, proposalCreateSchema)

  if (!result.success) return validationErrorResponse(result.errors)

  // Scan cover letter for contact sharing
  const filterResult = scanMessageContent(result.data.cover_letter)
  if (filterResult.blocked) {
    return errorResponse('Your cover letter contains contact information (phone, email, social media, or links). All communication must stay on HustleKE.', 400)
  }

  // Verify job exists and is open
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, status, client_id, requires_verified_only, min_hustle_score')
    .eq('id', result.data.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Open') return errorResponse('This job is no longer accepting proposals', 400)
  if (job.client_id === auth.profile.id) return errorResponse('You cannot submit a proposal on your own job', 400)

  // Check job requirements
  if (job.requires_verified_only && auth.profile.verification_status === 'Unverified') {
    return errorResponse('This job requires a verified profile', 403)
  }
  if (job.min_hustle_score > 0 && auth.profile.hustle_score < job.min_hustle_score) {
    return errorResponse(`This job requires a minimum Hustle Score of ${job.min_hustle_score}`, 403)
  }

  // Check for duplicate proposal
  const { data: existing, error: dupError } = await auth.adminDb
    .from('proposals')
    .select('id, status')
    .eq('job_id', result.data.job_id)
    .eq('freelancer_id', auth.profile.id)
    .maybeSingle()

  if (dupError) {
    console.error('[Proposals] Duplicate check error:', dupError)
  }

  if (existing) {
    console.log('[Proposals] Duplicate found:', existing.id, 'status:', existing.status, 'freelancer:', auth.profile.id, 'job:', result.data.job_id)
    return errorResponse(`You have already submitted a proposal for this job (status: ${existing.status})`, 409)
  }

  const { data: proposal, error } = await auth.adminDb
    .from('proposals')
    .insert({
      ...result.data,
      freelancer_id: auth.profile.id,
      cover_letter_original: result.data.cover_letter,
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to submit proposal', 500)

  // Notify client about the new proposal (site + email + SMS)
  const { data: jobData } = await auth.adminDb.from('jobs').select('title, client_id').eq('id', result.data.job_id).single()
  if (jobData) {
    notifyNewProposal(auth.adminDb, jobData.client_id, auth.profile.full_name, jobData.title).catch(console.error)
  }

  return jsonResponse({ proposal }, 201)
}
