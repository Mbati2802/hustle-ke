import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination, parseBody } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/users — List all users with filters
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const search = url.searchParams.get('search')
  const role = url.searchParams.get('role')
  const verification = url.searchParams.get('verification')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('profiles')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (role) {
    query = query.eq('role', role)
  }
  if (verification) {
    query = query.eq('verification_status', verification)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'score_high':
      query = query.order('hustle_score', { ascending: false })
      break
    case 'most_earned':
      query = query.order('total_earned', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: users, error, count } = await query

  if (error) return errorResponse('Failed to fetch users', 500)

  return jsonResponse({
    users,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/admin/users — Admin creates a new user
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<Record<string, unknown>>(req)
  if (!body) return errorResponse('Invalid request body')

  const { email, password, full_name, role, phone, county, location, bio, title, skills, hourly_rate } = body as Record<string, string | string[] | number | undefined>

  if (!email || !password || !full_name) {
    return errorResponse('Email, password, and full name are required')
  }
  if (typeof password === 'string' && password.length < 6) {
    return errorResponse('Password must be at least 6 characters')
  }

  const validRoles = ['Freelancer', 'Client', 'Admin']
  const userRole = validRoles.includes(role as string) ? role as string : 'Freelancer'

  const adminClient = createAdminClient()

  // Create auth user
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: email as string,
    password: password as string,
    email_confirm: true,
    user_metadata: { full_name, role: userRole },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return errorResponse('An account with this email already exists', 409)
    }
    return errorResponse(`Failed to create user: ${authError.message}`, 500)
  }

  // Create profile
  const profileData: Record<string, unknown> = {
    user_id: authData.user.id,
    full_name,
    email,
    role: userRole,
  }
  if (phone) profileData.phone = phone
  if (county) profileData.county = county
  if (location) profileData.location = location
  if (bio) profileData.bio = bio
  if (title) profileData.title = title
  if (skills && Array.isArray(skills)) profileData.skills = skills
  if (hourly_rate) profileData.hourly_rate = Number(hourly_rate)

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .insert(profileData)
    .select()
    .single()

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return errorResponse('Failed to create profile', 500)
  }

  // Create wallet
  await adminClient.from('wallets').insert({ user_id: profile.id })

  // Log activity
  await adminClient.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_user',
    entity_type: 'profiles',
    entity_id: profile.id,
    details: { email, role: userRole },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ profile }, 201)
}
