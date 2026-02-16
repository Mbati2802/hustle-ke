import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody, createPublicRouteClient, getPagination } from '@/lib/api-utils'
import { validate, jobCreateSchema } from '@/lib/validation'

// GET /api/jobs — List jobs with search/filter/pagination (public)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const myJobs = url.searchParams.get('my') === 'true'
  const orgId = url.searchParams.get('organization_id')

  // If my=true or organization_id is set, require authentication
  let supabase: ReturnType<typeof createPublicRouteClient>['supabase']
  let myProfileId: string | null = null

  if (myJobs || orgId) {
    const auth = await requireAuth(req)
    if (auth instanceof Response) return auth
    supabase = auth.adminDb as any
    if (myJobs) myProfileId = auth.profile.id
  } else {
    const { error: rlError, supabase: pub } = createPublicRouteClient(req)
    if (rlError) return rlError
    supabase = pub
  }

  const { limit, offset } = getPagination(req)

  // Org filter for org-mode (orgId already parsed above)

  // Filters
  const search = url.searchParams.get('search')
  const status = url.searchParams.get('status')
  const skills = url.searchParams.get('skills') // comma-separated
  const paymentType = url.searchParams.get('payment_type')
  const minBudget = url.searchParams.get('min_budget')
  const maxBudget = url.searchParams.get('max_budget')
  const county = url.searchParams.get('county')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = supabase!
    .from('jobs')
    .select('*, client:profiles!client_id(id, full_name, avatar_url, verification_status, hustle_score), organization:organizations!organization_id(id, name, logo_url)', { count: 'exact' })

  // My jobs filter — show all statuses for the owner
  if (myProfileId) {
    query = query.eq('client_id', myProfileId)
  }

  // Org jobs filter
  if (orgId) {
    query = query.eq('organization_id', orgId)
  }

  // Enterprise filter — show only org-posted jobs
  const enterprise = url.searchParams.get('enterprise')
  if (enterprise === 'true') {
    query = query.not('organization_id', 'is', null)
  }

  // Status filter (default to Open for public, all for my jobs and org jobs)
  const effectiveStatus = status || (myJobs || orgId ? 'all' : 'Open')
  if (effectiveStatus && effectiveStatus !== 'all') {
    query = query.eq('status', effectiveStatus)
  }

  // Text search
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Skills filter
  if (skills) {
    const skillArray = skills.split(',').map(s => s.trim()).filter(Boolean)
    if (skillArray.length > 0) {
      query = query.overlaps('skills_required', skillArray)
    }
  }

  // Payment type filter
  if (paymentType) {
    query = query.eq('payment_type', paymentType)
  }

  // Budget range filter
  if (minBudget) {
    query = query.gte('budget_max', parseInt(minBudget, 10))
  }
  if (maxBudget) {
    query = query.lte('budget_min', parseInt(maxBudget, 10))
  }

  // County filter
  if (county) {
    query = query.eq('location_preference', county)
  }

  // Sorting
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'budget_high':
      query = query.order('budget_max', { ascending: false })
      break
    case 'budget_low':
      query = query.order('budget_min', { ascending: true })
      break
    case 'most_proposals':
      query = query.order('proposals_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data: jobs, error, count } = await query

  if (error) {
    console.error('Jobs GET error:', error)
    return errorResponse('Failed to fetch jobs', 500)
  }

  return jsonResponse({
    jobs,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    },
  })
}

// POST /api/jobs — Create a new job (authenticated, Client or Admin)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (auth.profile.role === 'Freelancer') {
    return errorResponse('Freelancers cannot post jobs. Switch to Client role.', 403)
  }

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{
    title: string
    description: string
    budget_min: number
    budget_max: number
    payment_type?: string
    skills_required?: string[]
    tags?: string[]
    location_preference?: string
    remote_allowed?: boolean
    requires_verified_only?: boolean
    requires_swahili?: boolean
    min_hustle_score?: number
    deadline?: string
    organization_id?: string
  }>(body, jobCreateSchema)

  if (!result.success) return validationErrorResponse(result.errors)

  if (result.data.budget_min > result.data.budget_max) {
    return errorResponse('Minimum budget cannot exceed maximum budget')
  }

  const { data: job, error } = await auth.supabase
    .from('jobs')
    .insert({
      client_id: auth.profile.id,
      ...result.data,
    })
    .select()
    .single()

  if (error) {
    return errorResponse('Failed to create job', 500)
  }

  // Increment jobs_posted on profile
  await auth.supabase
    .from('profiles')
    .update({ jobs_posted: auth.profile.jobs_posted + 1 })
    .eq('id', auth.profile.id)

  return jsonResponse({ job }, 201)
}
