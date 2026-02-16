import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient, getPagination } from '@/lib/api-utils'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// GET /api/talent — List freelancer profiles (public) with search/filter/pagination
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  // Filters
  const search = url.searchParams.get('search')
  const skills = url.searchParams.get('skills') // comma-separated
  const county = url.searchParams.get('county')
  const verified = url.searchParams.get('verified')
  const sort = url.searchParams.get('sort') || 'score'
  const minRate = url.searchParams.get('min_rate')
  const maxRate = url.searchParams.get('max_rate')
  const availability = url.searchParams.get('availability')

  let query = supabase!
    .from('profiles')
    .select('id, full_name, avatar_url, bio, title, skills, hourly_rate, location, county, verification_status, hustle_score, jobs_completed, total_earned, languages, swahili_speaking, created_at, years_experience, availability', { count: 'exact' })
    .eq('role', 'Freelancer')

  // Text search (name, title, bio)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,title.ilike.%${search}%,bio.ilike.%${search}%`)
  }

  // Skills filter
  if (skills) {
    const skillArray = skills.split(',').map(s => s.trim()).filter(Boolean)
    if (skillArray.length > 0) {
      query = query.overlaps('skills', skillArray)
    }
  }

  // County filter
  if (county) {
    query = query.eq('county', county)
  }

  // Verified filter
  if (verified === 'true') {
    query = query.eq('verification_status', 'ID-Verified')
  }

  // Availability filter
  if (availability === 'available') {
    query = query.eq('availability', 'available')
  } else if (availability === 'busy') {
    query = query.eq('availability', 'busy')
  }

  // Hourly rate range
  if (minRate) {
    query = query.gte('hourly_rate', parseInt(minRate, 10))
  }
  if (maxRate) {
    query = query.lte('hourly_rate', parseInt(maxRate, 10))
  }

  // Sorting
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'rate_high':
      query = query.order('hourly_rate', { ascending: false, nullsFirst: false })
      break
    case 'rate_low':
      query = query.order('hourly_rate', { ascending: true, nullsFirst: false })
      break
    case 'most_jobs':
      query = query.order('jobs_completed', { ascending: false })
      break
    case 'earned':
      query = query.order('total_earned', { ascending: false })
      break
    default: // 'score' — highest hustle score first
      query = query.order('hustle_score', { ascending: false })
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data: profiles, error, count } = await query

  if (error) {
    console.error('Talent list error:', error)
    return errorResponse('Failed to fetch talent', 500)
  }

  // Enrich with Pro status
  let enrichedProfiles: any[] = profiles || []
  if (enrichedProfiles.length > 0) {
    const adminDb = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    )
    const profileIds = enrichedProfiles.map((p: any) => p.id)
    const { data: subs } = await adminDb
      .from('subscriptions')
      .select('user_id, plan')
      .in('user_id', profileIds)
      .eq('status', 'active')

    const proUsers = new Set(
      (subs || [])
        .filter((s: { plan: string }) => s.plan === 'pro' || s.plan === 'enterprise')
        .map((s: { user_id: string }) => s.user_id)
    )

    enrichedProfiles = enrichedProfiles.map((p: any) => ({
      ...p,
      is_pro: proUsers.has(p.id),
    }))

    // If sorting by score, boost Pro users to the top within same score tier
    if (sort === 'score') {
      enrichedProfiles.sort((a: any, b: any) => {
        if (b.hustle_score !== a.hustle_score) return b.hustle_score - a.hustle_score
        if (b.is_pro !== a.is_pro) return b.is_pro ? 1 : -1
        return 0
      })
    }
  }

  return jsonResponse({
    profiles: enrichedProfiles,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    },
  })
}
