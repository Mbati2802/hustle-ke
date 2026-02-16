import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/jobs/[id] — Get full job details (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: job, error } = await auth.supabase
    .from('jobs')
    .select('*, client:profiles!client_id(id, full_name, email, avatar_url, verification_status, hustle_score, location, county)')
    .eq('id', params.id)
    .single()

  if (error || !job) return errorResponse('Job not found', 404)

  const { data: proposals } = await auth.supabase
    .from('proposals')
    .select('*, freelancer:profiles!freelancer_id(id, full_name, hustle_score, verification_status)')
    .eq('job_id', params.id)
    .order('submitted_at', { ascending: false })
    .limit(50)

  return jsonResponse({ job, proposals: proposals || [] })
}

// PUT /api/admin/jobs/[id] — Admin full edit of any job field
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<Record<string, unknown>>(req)
  if (!body) return errorResponse('Invalid request body')

  const allowedFields = [
    'title', 'description', 'status', 'budget_min', 'budget_max',
    'payment_type', 'skills_required', 'tags', 'location_preference',
    'remote_allowed', 'requires_verified_only', 'requires_swahili',
    'min_hustle_score', 'deadline', 'is_boosted', 'boosted_until',
    'client_id',
  ]

  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      if (['budget_min', 'budget_max', 'min_hustle_score'].includes(key)) {
        updateData[key] = Number(body[key])
      } else {
        updateData[key] = body[key]
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('No valid fields to update')
  }

  const { data: job, error } = await auth.supabase
    .from('jobs')
    .update(updateData)
    .eq('id', params.id)
    .select('*, client:profiles!client_id(id, full_name, email)')
    .single()

  if (error) return errorResponse('Failed to update job', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_job',
    entity_type: 'jobs',
    entity_id: params.id,
    details: updateData,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ job })
}

// DELETE /api/admin/jobs/[id] — Admin delete any job
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)

  if (error) return errorResponse('Failed to delete job', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_job',
    entity_type: 'jobs',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ message: 'Job deleted' })
}
