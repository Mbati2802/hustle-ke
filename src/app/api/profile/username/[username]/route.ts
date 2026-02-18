import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// GET /api/profile/username/[username] — Resolve vanity username to public profile
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const client = createPublicRouteClient(req)
  if (client.error) return client.error
  const supabase = client.supabase

  const { username } = params
  const decoded = decodeURIComponent(username).toLowerCase()

  // Try to find by referral_code (case-insensitive)
  const { data: byCode } = await supabase
    .from('profiles')
    .select('id')
    .ilike('referral_code', decoded)
    .single()

  let profileId = byCode?.id

  // If not found by referral_code, try matching by slugified full_name
  if (!profileId) {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .not('full_name', 'is', null)

    if (allProfiles) {
      const match = allProfiles.find((p: { id: string; full_name: string }) => {
        const slug = p.full_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        return slug === decoded
      })
      if (match) profileId = match.id
    }
  }

  if (!profileId) {
    return errorResponse('Profile not found', 404)
  }

  // Fetch full public profile (reuse the same shape as /api/profile/[id])
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, title, bio, county, skills, hourly_rate, avatar_url, role, hustle_score, jobs_completed, total_earned, verification_status, is_verified, years_experience, availability, created_at')
    .eq('id', profileId)
    .single()

  if (error || !profile) {
    return errorResponse('Profile not found', 404)
  }

  // Get reviews stats
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', profileId)

  const reviewCount = reviews?.length || 0
  const avgRating = reviewCount > 0
    ? (reviews!.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviewCount)
    : 0

  // Check Pro status
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, expires_at')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .single()

  const isPro = !!sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  return jsonResponse({
    profile: {
      ...profile,
      avg_rating: Math.round(avgRating * 10) / 10,
      review_count: reviewCount,
      is_pro: isPro,
    },
  })
}
