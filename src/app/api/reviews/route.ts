import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody } from '@/lib/api-utils'
import { validate, reviewSchema } from '@/lib/validation'
import { recalculateHustleScore } from '@/lib/subscription-utils'
import { sanitizeHTML } from '@/lib/sanitize'

// POST /api/reviews — Create a review
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{
    job_id: string
    reviewee_id: string
    rating: number
    comment?: string
    communication_rating?: number
    quality_rating?: number
    timeliness_rating?: number
  }>(body, reviewSchema)

  if (!result.success) return validationErrorResponse(result.errors)

  if (result.data.reviewee_id === auth.profile.id) {
    return errorResponse('You cannot review yourself', 400)
  }

  // Verify the job exists and is completed
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, organization_id')
    .eq('id', result.data.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)
  if (job.status !== 'Completed') return errorResponse('Reviews can only be left for completed jobs', 400)

  // Verify reviewer is involved in the job
  let isClient = job.client_id === auth.profile.id
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id, freelancer_id')
    .eq('job_id', result.data.job_id)
    .eq('status', 'Accepted')
    .single()

  const isFreelancer = proposal?.freelancer_id === auth.profile.id

  // Org members can also leave reviews on org jobs
  if (!isClient && !isFreelancer && job.organization_id) {
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (mem) isClient = true
  }

  if (!isClient && !isFreelancer && auth.profile.role !== 'Admin') {
    return errorResponse('Only participants of this job can leave reviews', 403)
  }

  // Check for duplicate review
  const { data: existing } = await auth.supabase
    .from('reviews')
    .select('id')
    .eq('job_id', result.data.job_id)
    .eq('reviewer_id', auth.profile.id)
    .eq('reviewee_id', result.data.reviewee_id)
    .single()

  if (existing) return errorResponse('You have already reviewed this user for this job', 409)

  // Sanitize comment to prevent XSS
  const sanitizedData = {
    ...result.data,
    comment: result.data.comment ? sanitizeHTML(result.data.comment) : undefined,
  }

  const { data: review, error } = await auth.supabase
    .from('reviews')
    .insert({
      ...sanitizedData,
      reviewer_id: auth.profile.id,
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to create review', 500)

  // Recalculate hustle score for the reviewee
  await recalculateHustleScore(auth.adminDb, result.data.reviewee_id, 'review_received')

  return jsonResponse({ review }, 201)
}
