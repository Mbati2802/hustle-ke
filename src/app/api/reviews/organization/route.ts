import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/reviews/organization — Get reviews for organization jobs
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const { limit, offset } = getPagination(req)
  const orgId = url.searchParams.get('organization_id')

  if (!orgId) return errorResponse('organization_id is required', 400)

  // Verify user is org member
  const { data: member } = await auth.adminDb
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', auth.profile.id)
    .single()

  if (!member) return errorResponse('Not an organization member', 403)

  // Get reviews for organization jobs
  let query = auth.supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      communication_rating,
      quality_rating,
      timeliness_rating,
      created_at,
      reviewer:profiles!reviewer_id(id, full_name, avatar_url, title),
      reviewee:profiles!reviewee_id(id, full_name, avatar_url, title, skills, verification_status, hustle_score, hourly_rate),
      job:jobs!job_id(id, title, category, budget_min, budget_max, deadline, created_at)
    `, { count: 'exact' })
    .eq('job.organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: reviews, error, count } = await query

  if (error) return errorResponse('Failed to fetch reviews', 500)

  // Calculate stats
  const { data: stats } = await auth.supabase
    .from('reviews')
    .select('rating')
    .eq('job.organization_id', orgId)

  const averageRating = stats && stats.length > 0 
    ? stats.reduce((sum, r) => sum + r.rating, 0) / stats.length 
    : 0

  const ratingCounts = stats?.reduce((acc, r) => {
    acc[r.rating] = (acc[r.rating] || 0) + 1
    return acc
  }, {} as Record<number, number>) || {}

  return jsonResponse({
    reviews,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: stats?.length || 0,
      averageRating: Number(averageRating.toFixed(1)),
      ratingCounts,
    }
  })
}
