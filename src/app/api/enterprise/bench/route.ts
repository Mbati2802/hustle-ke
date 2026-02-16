import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/api-utils'

async function getUserOrg(auth: any) {
  const { data: ownedOrg } = await auth.supabase
    .from('organizations')
    .select('id, name')
    .eq('owner_id', auth.profile.id)
    .eq('is_active', true)
    .single()
  if (ownedOrg) return ownedOrg

  const { data: membership } = await auth.supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name)')
    .eq('user_id', auth.profile.id)
    .limit(1)
    .single()
  return membership?.organizations as any || null
}

// GET /api/enterprise/bench — List freelancer bench
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const org = await getUserOrg(auth)
    if (!org) return errorResponse('No organization found', 404)

    const { data: bench } = await auth.supabase
      .from('organization_bench')
      .select(`
        id, notes, tags, internal_rating, times_hired, last_hired_at, created_at,
        freelancer:freelancer_id(id, full_name, email, avatar_url, title, skills, hustle_score, hourly_rate, jobs_completed, county),
        added_by_profile:added_by(full_name)
      `)
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })

    return jsonResponse({ bench: bench || [] })
  } catch (err) {
    console.error('[Enterprise Bench GET]', err)
    return errorResponse('Failed to fetch bench', 500)
  }
}

// POST /api/enterprise/bench — Add freelancer to bench
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const org = await getUserOrg(auth)
    if (!org) return errorResponse('No organization found', 404)

    const body = await req.json()
    const { freelancer_id, notes, tags, internal_rating } = body

    if (!freelancer_id) return errorResponse('freelancer_id is required')

    // Verify freelancer exists
    const { data: freelancer } = await auth.supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', freelancer_id)
      .single()

    if (!freelancer) return errorResponse('Freelancer not found', 404)

    const { data: entry, error: insertErr } = await auth.supabase
      .from('organization_bench')
      .insert({
        organization_id: org.id,
        freelancer_id,
        added_by: auth.profile.id,
        notes: notes?.trim() || null,
        tags: tags || [],
        internal_rating: internal_rating || null,
      })
      .select()
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') return errorResponse('Freelancer already on your bench')
      console.error('[Enterprise Bench POST]', insertErr)
      return errorResponse('Failed to add to bench', 500)
    }

    await auth.supabase.from('organization_activity_log').insert({
      organization_id: org.id,
      user_id: auth.profile.id,
      action: 'bench_freelancer_added',
      entity_type: 'bench',
      entity_id: entry.id,
      details: { freelancer_name: freelancer.full_name },
    })

    return jsonResponse({ entry }, 201)
  } catch (err) {
    console.error('[Enterprise Bench POST]', err)
    return errorResponse('Failed to add to bench', 500)
  }
}

// PUT /api/enterprise/bench — Update bench entry
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const org = await getUserOrg(auth)
    if (!org) return errorResponse('No organization found', 404)

    const body = await req.json()
    const { bench_id, notes, tags, internal_rating } = body

    if (!bench_id) return errorResponse('bench_id is required')

    const updates: Record<string, unknown> = {}
    if (notes !== undefined) updates.notes = notes?.trim() || null
    if (tags !== undefined) updates.tags = tags
    if (internal_rating !== undefined) updates.internal_rating = internal_rating

    const { data: updated, error: updateErr } = await auth.supabase
      .from('organization_bench')
      .update(updates)
      .eq('id', bench_id)
      .eq('organization_id', org.id)
      .select()
      .single()

    if (updateErr) return errorResponse('Failed to update bench entry', 500)

    return jsonResponse({ entry: updated })
  } catch (err) {
    console.error('[Enterprise Bench PUT]', err)
    return errorResponse('Failed to update bench entry', 500)
  }
}

// DELETE /api/enterprise/bench — Remove from bench
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const org = await getUserOrg(auth)
    if (!org) return errorResponse('No organization found', 404)

    const { searchParams } = new URL(req.url)
    const benchId = searchParams.get('id')
    if (!benchId) return errorResponse('id query parameter is required')

    await auth.supabase
      .from('organization_bench')
      .delete()
      .eq('id', benchId)
      .eq('organization_id', org.id)

    return jsonResponse({ success: true })
  } catch (err) {
    console.error('[Enterprise Bench DELETE]', err)
    return errorResponse('Failed to remove from bench', 500)
  }
}
