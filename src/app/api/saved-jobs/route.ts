import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/saved-jobs — Get user's saved jobs
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const search = url.searchParams.get('search')

  let query = auth.supabase
    .from('saved_jobs')
    .select(`
      *,
      job:jobs!job_id(
        id, title, description, budget_min, budget_max, status, 
        deadline, category, created_at, proposals_count,
        client:profiles!client_id(id, full_name, avatar_url)
      )
    `, { count: 'exact' })
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`job.title.ilike.%${search}%,job.description.ilike.%${search}%`)
  }

  const { data: savedJobs, error, count } = await query

  if (error) return errorResponse('Failed to fetch saved jobs', 500)

  return jsonResponse({
    savedJobs,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/saved-jobs — Save a job
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json()
  if (!body?.job_id) return errorResponse('job_id is required')

  // Verify the job exists and is open
  const { data: job } = await auth.supabase
    .from('jobs')
    .select('id, status')
    .eq('id', body.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Open') return errorResponse('Only open jobs can be saved', 400)

  const { data: savedJob, error } = await auth.supabase
    .from('saved_jobs')
    .insert({
      user_id: auth.profile.id,
      job_id: body.job_id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') { // Unique violation
      return errorResponse('Job already saved', 409)
    }
    return errorResponse('Failed to save job', 500)
  }

  return jsonResponse({ savedJob }, 201)
}
