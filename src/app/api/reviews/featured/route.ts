import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// GET /api/reviews/featured — Get top-rated reviews for homepage showcase
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '8'), 20)
  const skill = url.searchParams.get('skill') // filter by freelancer skill
  const minRating = parseInt(url.searchParams.get('min_rating') || '4')

  // Fetch top reviews with reviewer + reviewee (freelancer) + job info
  let query = supabase!
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      communication_rating,
      quality_rating,
      timeliness_rating,
      created_at,
      reviewer:profiles!reviewer_id(id, full_name, avatar_url, title, county),
      reviewee:profiles!reviewee_id(id, full_name, avatar_url, title, skills, verification_status, hustle_score, hourly_rate),
      job:jobs!job_id(id, title, skills_required)
    `)
    .eq('is_public', true)
    .gte('rating', minRating)
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data: reviews, error } = await query

  if (error) {
    console.error('[Reviews Featured] Error:', error)
    return errorResponse('Failed to fetch featured reviews', 500)
  }

  // If skill filter is applied, filter client-side (Supabase doesn't support array contains on joined tables easily)
  let filtered = reviews || []
  if (skill) {
    const skillLower = skill.toLowerCase()
    filtered = filtered.filter((r: any) =>
      r.reviewee?.skills?.some((s: string) => s.toLowerCase().includes(skillLower)) ||
      r.job?.skills_required?.some((s: string) => s.toLowerCase().includes(skillLower))
    )
  }

  // Get unique skill categories from all reviews for filter options
  const skillSet = new Set<string>()
  ;(reviews || []).forEach((r: any) => {
    r.reviewee?.skills?.forEach((s: string) => skillSet.add(s))
    r.job?.skills_required?.forEach((s: string) => skillSet.add(s))
  })

  return jsonResponse({
    reviews: filtered,
    filters: {
      skills: Array.from(skillSet).sort(),
    },
  })
}
