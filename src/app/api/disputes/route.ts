import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody, getPagination } from '@/lib/api-utils'

// GET /api/disputes — List current user's disputes
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)

  const { data: disputes, error, count } = await auth.supabase
    .from('disputes')
    .select('*, job:jobs!job_id(id, title), initiator:profiles!initiator_id(id, full_name), respondent:profiles!respondent_id(id, full_name)', { count: 'exact' })
    .or(`initiator_id.eq.${auth.profile.id},respondent_id.eq.${auth.profile.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return errorResponse('Failed to fetch disputes', 500)

  return jsonResponse({
    disputes,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/disputes — Create a dispute
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    job_id: string
    escrow_id: string
    respondent_id: string
    reason: string
    description?: string
    evidence_urls?: string[]
  }>(req)

  if (!body) return errorResponse('Invalid request body')
  if (!body.job_id || !body.escrow_id || !body.respondent_id || !body.reason) {
    return errorResponse('job_id, escrow_id, respondent_id, and reason are required')
  }
  if (body.reason.length < 10) return errorResponse('Reason must be at least 10 characters')
  if (body.reason.length > 2000) return errorResponse('Reason must be at most 2000 characters')
  if (body.respondent_id === auth.profile.id) return errorResponse('You cannot dispute yourself')

  // Verify escrow exists and is active
  const { data: escrow } = await auth.supabase
    .from('escrow_transactions')
    .select('id, status, client_id, freelancer_id')
    .eq('id', body.escrow_id)
    .single()

  if (!escrow) return errorResponse('Escrow transaction not found', 404)
  if (escrow.status !== 'Held') return errorResponse('Can only dispute escrow in Held status', 400)

  const isParty = escrow.client_id === auth.profile.id || escrow.freelancer_id === auth.profile.id
  if (!isParty) return errorResponse('Only parties involved in the escrow can file a dispute', 403)

  // Check for existing open dispute
  const { data: existing } = await auth.supabase
    .from('disputes')
    .select('id')
    .eq('escrow_id', body.escrow_id)
    .eq('status', 'Open')
    .single()

  if (existing) return errorResponse('An open dispute already exists for this escrow', 409)

  // Create dispute
  const { data: dispute, error } = await auth.supabase
    .from('disputes')
    .insert({
      job_id: body.job_id,
      escrow_id: body.escrow_id,
      initiator_id: auth.profile.id,
      respondent_id: body.respondent_id,
      reason: body.reason,
      description: body.description || null,
      evidence_urls: body.evidence_urls || [],
      status: 'Open',
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to create dispute', 500)

  // Update escrow status to Disputed
  await auth.supabase
    .from('escrow_transactions')
    .update({ status: 'Disputed' })
    .eq('id', body.escrow_id)

  // Update job status to Disputed
  await auth.supabase
    .from('jobs')
    .update({ status: 'Disputed' })
    .eq('id', body.job_id)

  return jsonResponse({ dispute }, 201)
}
