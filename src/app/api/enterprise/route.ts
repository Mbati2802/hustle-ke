import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// GET /api/enterprise — Get user's organization
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    // Check if user owns an org
    const { data: ownedOrg } = await auth.supabase
      .from('organizations')
      .select('*, organization_members(id, user_id, role, joined_at, profiles:user_id(full_name, email, avatar_url, title, role))')
      .eq('owner_id', auth.profile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (ownedOrg) {
      return jsonResponse({ organization: ownedOrg, role: 'owner' })
    }

    // Check if user is a member of an org
    const { data: membership } = await auth.supabase
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', auth.profile.id)
      .limit(1)
      .maybeSingle()

    if (membership) {
      return jsonResponse({ organization: membership.organization, role: membership.role, membership })
    }

    return jsonResponse({ organization: null })
  } catch (err) {
    console.error('[Enterprise GET]', err)
    return errorResponse('Failed to fetch organization', 500)
  }
}

// POST /api/enterprise — Create organization
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()
    const { name, description, website, industry, size, county } = body

    if (!name || name.trim().length < 2) {
      return errorResponse('Organization name must be at least 2 characters')
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const slug = `${baseSlug}-${Date.now().toString(36)}`

    // Check if user already owns an org
    const { data: existing } = await auth.supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', auth.profile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existing) {
      return errorResponse('You already own an organization. Manage it from your Enterprise dashboard.')
    }

    // Create organization
    const { data: org, error: createErr } = await auth.supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        website: website?.trim() || null,
        industry: industry?.trim() || null,
        size: size || '1-10',
        county: county?.trim() || null,
        owner_id: auth.profile.id,
      })
      .select()
      .single()

    if (createErr) {
      console.error('[Enterprise POST] Create error:', createErr)
      return errorResponse(`Failed to create organization: ${createErr.message}`, 500)
    }

    // Add owner as a member with owner role
    await auth.supabase.from('organization_members').insert({
      organization_id: org.id,
      user_id: auth.profile.id,
      role: 'owner',
      permissions: {
        can_post_jobs: true,
        can_manage_escrow: true,
        can_invite_members: true,
        can_view_analytics: true,
        can_manage_bench: true,
        can_manage_settings: true,
      },
    })

    // Log activity
    await auth.supabase.from('organization_activity_log').insert({
      organization_id: org.id,
      user_id: auth.profile.id,
      action: 'organization_created',
      entity_type: 'settings',
      details: { name: org.name },
    })

    return jsonResponse({ organization: org }, 201)
  } catch (err) {
    console.error('[Enterprise POST]', err)
    return errorResponse('Failed to create organization', 500)
  }
}

// PUT /api/enterprise — Update organization
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()
    const { name, description, website, industry, size, county, webhook_url } = body

    // Get org where user is owner or admin
    const { data: org } = await auth.supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', auth.profile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!org) {
      return errorResponse('Organization not found or insufficient permissions', 404)
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (website !== undefined) updates.website = website?.trim() || null
    if (industry !== undefined) updates.industry = industry?.trim() || null
    if (size !== undefined) updates.size = size
    if (county !== undefined) updates.county = county?.trim() || null
    if (webhook_url !== undefined) updates.webhook_url = webhook_url?.trim() || null

    const { data: updated, error: updateErr } = await auth.supabase
      .from('organizations')
      .update(updates)
      .eq('id', org.id)
      .select()
      .single()

    if (updateErr) return errorResponse('Failed to update organization', 500)

    await auth.supabase.from('organization_activity_log').insert({
      organization_id: org.id,
      user_id: auth.profile.id,
      action: 'organization_updated',
      entity_type: 'settings',
      details: { fields: Object.keys(updates) },
    })

    return jsonResponse({ organization: updated })
  } catch (err) {
    console.error('[Enterprise PUT]', err)
    return errorResponse('Failed to update organization', 500)
  }
}
