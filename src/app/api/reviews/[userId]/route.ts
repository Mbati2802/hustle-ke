import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient, getPagination } from '@/lib/api-utils'

// GET /api/reviews/[userId] — Get reviews for a user (public)
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const { limit, offset } = getPagination(req)

  const { data: reviews, error, count } = await supabase!
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(id, full_name, avatar_url), job:jobs!job_id(id, title)', { count: 'exact' })
    .eq('reviewee_id', params.userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return errorResponse('Failed to fetch reviews', 500)

  // Calculate average ratings
  const { data: avgData } = await supabase!
    .from('reviews')
    .select('rating, communication_rating, quality_rating, timeliness_rating')
    .eq('reviewee_id', params.userId)
    .eq('is_public', true)

  let avgRating = 0
  let totalReviews = 0
  if (avgData && avgData.length > 0) {
    totalReviews = avgData.length
    avgRating = avgData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
  }

  return jsonResponse({
    reviews,
    stats: {
      average_rating: Math.round(avgRating * 10) / 10,
      total_reviews: totalReviews,
    },
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
