import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import { notifyOrgInvite } from '@/lib/notifications'

// Helper: get user's org and verify membership role
async function getOrgForUser(auth: any) {
  // Check owned org first
  const { data: ownedOrg } = await auth.supabase
    .from('organizations')
    .select('id, name, max_seats, owner_id')
    .eq('owner_id', auth.profile.id)
    .eq('is_active', true)
    .single()

  if (ownedOrg) return { org: ownedOrg, role: 'owner' }

  // Check membership
  const { data: membership } = await auth.supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, max_seats, owner_id)')
    .eq('user_id', auth.profile.id)
    .limit(1)
    .single()

  if (membership?.organizations) {
    return { org: membership.organizations as any, role: membership.role }
  }

  return null
}

// GET /api/enterprise/members — List org members
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const orgInfo = await getOrgForUser(auth)
    if (!orgInfo) return errorResponse('No organization found', 404)

    const { data: members } = await auth.supabase
      .from('organization_members')
      .select('id, user_id, role, permissions, joined_at, invited_by, profiles:user_id(id, full_name, email, avatar_url, title, role, hustle_score)')
      .eq('organization_id', orgInfo.org.id)
      .order('joined_at', { ascending: true })

    // Get pending invites
    const { data: invites } = await auth.supabase
      .from('organization_invites')
      .select('id, email, role, status, invited_by, expires_at, created_at')
      .eq('organization_id', orgInfo.org.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return jsonResponse({
      members: members || [],
      invites: invites || [],
      max_seats: orgInfo.org.max_seats,
      current_count: (members || []).length,
    })
  } catch (err) {
    console.error('[Enterprise Members GET]', err)
    return errorResponse('Failed to fetch members', 500)
  }
}

// POST /api/enterprise/members — Invite a member
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const orgInfo = await getOrgForUser(auth)
    if (!orgInfo) return errorResponse('No organization found', 404)
    if (!['owner', 'admin'].includes(orgInfo.role)) {
      return errorResponse('Only owners and admins can invite members')
    }

    const body = await req.json()
    const { email, role = 'member' } = body

    if (!email || !email.includes('@')) {
      return errorResponse('Valid email is required')
    }

    const validRoles = ['admin', 'hiring_manager', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return errorResponse(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }

    // Check seat limit
    const { count } = await auth.adminDb
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgInfo.org.id)

    if ((count || 0) >= orgInfo.org.max_seats) {
      return errorResponse(`Seat limit reached (${orgInfo.org.max_seats}). Upgrade to add more members.`)
    }

    // Look up the invited user's profile by email (use adminDb to access auth.users join)
    const { data: invitedUser } = await auth.adminDb
      .from('profiles')
      .select('id, user_id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    // Check if already a member
    if (invitedUser) {
      const { data: existingMember } = await auth.adminDb
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgInfo.org.id)
        .eq('user_id', invitedUser.id)
        .maybeSingle()

      if (existingMember) {
        return errorResponse('This user is already a member of the organization')
      }
    }

    // Check if already invited
    const { data: existingInvite } = await auth.adminDb
      .from('organization_invites')
      .select('id')
      .eq('organization_id', orgInfo.org.id)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvite) {
      return errorResponse('An invite has already been sent to this email')
    }

    // Create invite
    const { data: invite, error: inviteErr } = await auth.adminDb
      .from('organization_invites')
      .insert({
        organization_id: orgInfo.org.id,
        email: email.toLowerCase().trim(),
        role,
        invited_by: auth.profile.id,
      })
      .select()
      .single()

    if (inviteErr) {
      console.error('[Enterprise Members POST] Invite error:', inviteErr)
      return errorResponse('Failed to create invite', 500)
    }

    // Log activity
    await auth.adminDb.from('organization_activity_log').insert({
      organization_id: orgInfo.org.id,
      user_id: auth.profile.id,
      action: 'member_invited',
      entity_type: 'invite',
      entity_id: invite.id,
      details: { email, role },
    })

    // Send in-app notification to the invited user (if they have an account)
    const { data: invitedProfile } = await auth.adminDb
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (invitedProfile) {
      notifyOrgInvite(
        auth.adminDb,
        invitedProfile.id,
        orgInfo.org.name,
        role,
        auth.profile.full_name
      ).catch(console.error)
    }

    return jsonResponse({ invite }, 201)
  } catch (err) {
    console.error('[Enterprise Members POST]', err)
    return errorResponse('Failed to invite member', 500)
  }
}

// PUT /api/enterprise/members — Update member role or remove
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const orgInfo = await getOrgForUser(auth)
    if (!orgInfo) return errorResponse('No organization found', 404)
    if (!['owner', 'admin'].includes(orgInfo.role)) {
      return errorResponse('Only owners and admins can manage members')
    }

    const body = await req.json()
    const { member_id, action, role, permissions } = body

    if (!member_id) return errorResponse('member_id is required')

    if (action === 'remove') {
      // Can't remove the owner
      const { data: member } = await auth.supabase
        .from('organization_members')
        .select('role, user_id')
        .eq('id', member_id)
        .eq('organization_id', orgInfo.org.id)
        .single()

      if (!member) return errorResponse('Member not found', 404)
      if (member.role === 'owner') return errorResponse('Cannot remove the organization owner')

      await auth.supabase
        .from('organization_members')
        .delete()
        .eq('id', member_id)
        .eq('organization_id', orgInfo.org.id)

      await auth.supabase.from('organization_activity_log').insert({
        organization_id: orgInfo.org.id,
        user_id: auth.profile.id,
        action: 'member_removed',
        entity_type: 'member',
        entity_id: member_id,
        details: { removed_user_id: member.user_id },
      })

      return jsonResponse({ success: true })
    }

    if (action === 'update_role') {
      if (!role) return errorResponse('role is required')

      const { data: updated, error: updateErr } = await auth.supabase
        .from('organization_members')
        .update({ role, ...(permissions ? { permissions } : {}) })
        .eq('id', member_id)
        .eq('organization_id', orgInfo.org.id)
        .select()
        .single()

      if (updateErr) return errorResponse('Failed to update member', 500)

      await auth.supabase.from('organization_activity_log').insert({
        organization_id: orgInfo.org.id,
        user_id: auth.profile.id,
        action: 'member_role_updated',
        entity_type: 'member',
        entity_id: member_id,
        details: { new_role: role },
      })

      return jsonResponse({ member: updated })
    }

    return errorResponse('Invalid action. Use "remove" or "update_role".')
  } catch (err) {
    console.error('[Enterprise Members PUT]', err)
    return errorResponse('Failed to manage member', 500)
  }
}
