import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination, parseBody } from '@/lib/api-utils'

// GET /api/admin/jobs — List all jobs with filters (admin)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const search = url.searchParams.get('search')
  const status = url.searchParams.get('status')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('jobs')
    .select('*, client:profiles!client_id(id, full_name, email)', { count: 'exact' })

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'budget_high':
      query = query.order('budget_max', { ascending: false })
      break
    case 'most_proposals':
      query = query.order('proposals_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: jobs, error, count } = await query

  if (error) return errorResponse('Failed to fetch jobs', 500)

  return jsonResponse({
    jobs,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/admin/jobs — Admin creates a job (on behalf of a client)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<Record<string, unknown>>(req)
  if (!body) return errorResponse('Invalid request body')

  const { client_id, title, description, budget_min, budget_max, payment_type, status,
    skills_required, tags, location_preference, remote_allowed, requires_verified_only,
    requires_swahili, min_hustle_score, deadline, is_boosted } = body

  if (!client_id || !title || !description || !budget_min || !budget_max) {
    return errorResponse('client_id, title, description, budget_min, and budget_max are required')
  }

  const jobData: Record<string, unknown> = {
    client_id,
    title,
    description,
    budget_min: Number(budget_min),
    budget_max: Number(budget_max),
    payment_type: payment_type || 'Fixed',
    status: status || 'Open',
  }
  if (skills_required) jobData.skills_required = skills_required
  if (tags) jobData.tags = tags
  if (location_preference) jobData.location_preference = location_preference
  if (remote_allowed !== undefined) jobData.remote_allowed = remote_allowed
  if (requires_verified_only !== undefined) jobData.requires_verified_only = requires_verified_only
  if (requires_swahili !== undefined) jobData.requires_swahili = requires_swahili
  if (min_hustle_score) jobData.min_hustle_score = Number(min_hustle_score)
  if (deadline) jobData.deadline = deadline
  if (is_boosted !== undefined) jobData.is_boosted = is_boosted

  const { data: job, error } = await auth.supabase
    .from('jobs')
    .insert(jobData)
    .select('*, client:profiles!client_id(id, full_name, email)')
    .single()

  if (error) return errorResponse(`Failed to create job: ${error.message}`, 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_job',
    entity_type: 'jobs',
    entity_id: job.id,
    details: { title, client_id },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ job }, 201)
}
