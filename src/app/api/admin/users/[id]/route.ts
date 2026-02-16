import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase'

// GET /api/admin/users/[id] — Get full user details (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: profile, error } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !profile) return errorResponse('User not found', 404)

  // Fetch related stats
  const [
    { count: jobsPosted },
    { count: proposalsSent },
    { count: disputesCount },
    { data: wallet },
    { data: recentReviews },
  ] = await Promise.all([
    auth.supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('client_id', params.id),
    auth.supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('freelancer_id', params.id),
    auth.supabase.from('disputes').select('*', { count: 'exact', head: true }).or(`initiator_id.eq.${params.id},respondent_id.eq.${params.id}`),
    auth.supabase.from('wallets').select('*').eq('user_id', params.id).single(),
    auth.supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(id, full_name)').eq('reviewee_id', params.id).order('created_at', { ascending: false }).limit(5),
  ])

  return jsonResponse({
    profile,
    stats: {
      jobs_posted: jobsPosted || 0,
      proposals_sent: proposalsSent || 0,
      disputes: disputesCount || 0,
    },
    wallet: wallet || null,
    recent_reviews: recentReviews || [],
  })
}

// PUT /api/admin/users/[id] — Admin update user (role, verification, ban, etc.)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<Record<string, unknown>>(req)
  if (!body) return errorResponse('Invalid request body')

  // Allowed admin-editable fields
  const allowedFields = [
    'role', 'verification_status', 'id_verified', 'skill_tested',
    'hustle_score', 'ai_score', 'full_name', 'email', 'bio',
    'phone', 'location', 'county', 'title', 'skills', 'hourly_rate',
    'avatar_url', 'mpesa_phone', 'mpesa_verified', 'languages',
    'swahili_speaking', 'total_earned', 'jobs_completed', 'jobs_posted',
  ]

  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key]
    }
  }

  // Validate role if provided
  if (updateData.role && !['Freelancer', 'Client', 'Admin'].includes(updateData.role as string)) {
    return errorResponse('Invalid role. Must be Freelancer, Client, or Admin')
  }

  // Validate verification_status if provided
  if (updateData.verification_status && !['Unverified', 'ID-Verified', 'Skill-Tested'].includes(updateData.verification_status as string)) {
    return errorResponse('Invalid verification status')
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('No valid fields to update')
  }

  // Set verification timestamps
  if (updateData.id_verified === true) {
    updateData.id_verified_at = new Date().toISOString()
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update user', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_user',
    entity_type: 'profiles',
    entity_id: params.id,
    details: updateData,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ profile: updated })
}

// DELETE /api/admin/users/[id] — Delete user (admin only, uses service role)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  // Get the user_id (auth UUID) from profile
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!profile) return errorResponse('User not found', 404)

  // Use admin client to delete auth user (cascades to profile via FK)
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(profile.user_id)

  if (error) return errorResponse('Failed to delete user', 500)

  return jsonResponse({ message: 'User deleted successfully' })
}
