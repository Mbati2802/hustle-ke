import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient, getPagination } from '@/lib/api-utils'

// GET /api/reviews/all — Get all public reviews with filters for the reviews page
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const url = new URL(req.url)
  const { limit, offset } = getPagination(req)
  const rating = url.searchParams.get('rating') // exact rating filter (1-5)
  const skill = url.searchParams.get('skill') // filter by skill
  const sort = url.searchParams.get('sort') || 'newest' // newest, highest, lowest
  const search = url.searchParams.get('search') // search in comment text

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
    `, { count: 'exact' })
    .eq('is_public', true)
    .not('comment', 'is', null)
    .neq('comment', '')

  // Rating filter
  if (rating) {
    const r = parseInt(rating)
    if (r >= 1 && r <= 5) {
      query = query.eq('rating', r)
    }
  }

  // Search in comments
  if (search) {
    query = query.ilike('comment', `%${search}%`)
  }

  // Sorting
  switch (sort) {
    case 'highest':
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
      break
    case 'lowest':
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
      break
    default: // newest
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: reviews, error, count } = await query

  if (error) {
    console.error('[Reviews All] Error:', error)
    return errorResponse('Failed to fetch reviews', 500)
  }

  // Post-filter by skill if specified (can't filter on joined table arrays easily in PostgREST)
  let filtered = reviews || []
  if (skill) {
    const skillLower = skill.toLowerCase()
    filtered = filtered.filter((r: any) =>
      r.reviewee?.skills?.some((s: string) => s.toLowerCase().includes(skillLower)) ||
      r.job?.skills_required?.some((s: string) => s.toLowerCase().includes(skillLower))
    )
  }

  // Get aggregate stats
  const { data: statsData } = await supabase!
    .from('reviews')
    .select('rating')
    .eq('is_public', true)
    .not('comment', 'is', null)
    .neq('comment', '')

  const stats = { total: 0, average: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number> }
  if (statsData && statsData.length > 0) {
    stats.total = statsData.length
    stats.average = Math.round((statsData.reduce((s, r) => s + r.rating, 0) / statsData.length) * 10) / 10
    statsData.forEach(r => { stats.distribution[r.rating] = (stats.distribution[r.rating] || 0) + 1 })
  }

  // Get popular skills from all reviews for filter sidebar
  const { data: skillReviews } = await supabase!
    .from('reviews')
    .select('reviewee:profiles!reviewee_id(skills), job:jobs!job_id(skills_required)')
    .eq('is_public', true)
    .not('comment', 'is', null)
    .neq('comment', '')
    .limit(200)

  const skillCount: Record<string, number> = {}
  ;(skillReviews || []).forEach((r: any) => {
    const allSkills = [...(r.reviewee?.skills || []), ...(r.job?.skills_required || [])]
    allSkills.forEach((s: string) => { skillCount[s] = (skillCount[s] || 0) + 1 })
  })
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }))

  return jsonResponse({
    reviews: filtered,
    stats,
    filters: { skills: topSkills },
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
