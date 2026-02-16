import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// GET /api/enterprise/invites — Get pending invites for current user
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    // Find invites matching user's email
    const { data: invites } = await auth.adminDb
      .from('organization_invites')
      .select('id, email, role, status, expires_at, created_at, organization:organization_id(id, name, logo_url, industry), inviter:invited_by(full_name, avatar_url)')
      .eq('email', auth.profile.email.toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return jsonResponse({ invites: invites || [] })
  } catch (err) {
    console.error('[Enterprise Invites GET]', err)
    return errorResponse('Failed to fetch invites', 500)
  }
}

// POST /api/enterprise/invites — Accept or decline an invite
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await req.json()
    const { invite_id, action } = body

    if (!invite_id) return errorResponse('invite_id is required')
    if (!['accept', 'decline'].includes(action)) return errorResponse('action must be "accept" or "decline"')

    // Get invite and verify it belongs to this user
    const { data: invite } = await auth.adminDb
      .from('organization_invites')
      .select('*, organization:organization_id(id, name, max_seats)')
      .eq('id', invite_id)
      .eq('status', 'pending')
      .single()

    if (!invite) return errorResponse('Invite not found or already used', 404)

    // Verify email matches
    if (invite.email.toLowerCase() !== auth.profile.email.toLowerCase()) {
      return errorResponse('This invite is not for your account', 403)
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      await auth.adminDb
        .from('organization_invites')
        .update({ status: 'expired' })
        .eq('id', invite_id)
      return errorResponse('This invite has expired')
    }

    if (action === 'decline') {
      await auth.adminDb
        .from('organization_invites')
        .update({ status: 'cancelled' })
        .eq('id', invite_id)

      return jsonResponse({ success: true, message: 'Invite declined' })
    }

    // Accept invite
    // Check if already a member
    const { data: existingMember } = await auth.adminDb
      .from('organization_members')
      .select('id')
      .eq('organization_id', invite.organization_id)
      .eq('user_id', auth.profile.id)
      .maybeSingle()

    if (existingMember) {
      await auth.adminDb
        .from('organization_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invite_id)
      return jsonResponse({ success: true, message: 'You are already a member of this organization' })
    }

    // Check seat limit
    const { count } = await auth.adminDb
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', invite.organization_id)

    const org = invite.organization as any
    if ((count || 0) >= (org?.max_seats || 10)) {
      return errorResponse('Organization has reached its seat limit. Contact the admin.')
    }

    // Build permissions based on role
    const permissionsByRole: Record<string, Record<string, boolean>> = {
      admin: { can_post_jobs: true, can_manage_escrow: true, can_invite_members: true, can_view_analytics: true, can_manage_bench: true, can_manage_settings: true },
      hiring_manager: { can_post_jobs: true, can_manage_escrow: true, can_invite_members: false, can_view_analytics: true, can_manage_bench: true, can_manage_settings: false },
      member: { can_post_jobs: true, can_manage_escrow: false, can_invite_members: false, can_view_analytics: true, can_manage_bench: true, can_manage_settings: false },
      viewer: { can_post_jobs: false, can_manage_escrow: false, can_invite_members: false, can_view_analytics: true, can_manage_bench: false, can_manage_settings: false },
    }

    // Add as member
    const { error: memberErr } = await auth.adminDb
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: auth.profile.id,
        role: invite.role,
        invited_by: invite.invited_by,
        permissions: permissionsByRole[invite.role] || permissionsByRole.member,
      })

    if (memberErr) {
      console.error('[Enterprise Invites POST] member insert error:', memberErr)
      return errorResponse('Failed to join organization', 500)
    }

    // Mark invite as accepted
    await auth.adminDb
      .from('organization_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite_id)

    // Log activity
    await auth.adminDb.from('organization_activity_log').insert({
      organization_id: invite.organization_id,
      user_id: auth.profile.id,
      action: 'member_joined',
      entity_type: 'member',
      details: { role: invite.role, invite_id: invite.id, member_name: auth.profile.full_name },
    })

    return jsonResponse({
      success: true,
      message: `You have joined ${org?.name || 'the organization'} as ${invite.role}`,
      organization_id: invite.organization_id,
    })
  } catch (err) {
    console.error('[Enterprise Invites POST]', err)
    return errorResponse('Failed to process invite', 500)
  }
}
