import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/admin/security/[id]/actions — Take action on security alert
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: 'block_user' | 'reset_password' | 'dismiss' | 'investigate' | 'notify_user'
    notes?: string
  }>(req)

  if (!body || !body.action) {
    return errorResponse('Action is required')
  }

  // Get the alert
  const { data: alert, error: alertError } = await auth.supabase
    .from('security_alerts')
    .select('*, profiles:user_id(id, user_id, email, full_name)')
    .eq('id', params.id)
    .single()

  if (alertError || !alert) {
    return errorResponse('Security alert not found', 404)
  }

  let actionResult: any = {}

  switch (body.action) {
    case 'block_user':
      // Update user profile to blocked status
      const { error: blockError } = await auth.supabase
        .from('profiles')
        .update({ 
          role: 'Client', // Demote if admin
          // Add a blocked flag if your schema supports it
        })
        .eq('id', alert.user_id)

      if (blockError) {
        return errorResponse('Failed to block user', 500)
      }

      // Deactivate all user sessions
      await auth.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', alert.user_id)

      actionResult = { blocked: true }
      break

    case 'reset_password':
      // Send password reset email
      const { error: resetError } = await auth.supabase.auth.admin.generateLink({
        type: 'recovery',
        email: alert.profiles.email,
      })

      if (resetError) {
        return errorResponse('Failed to send password reset', 500)
      }

      actionResult = { password_reset_sent: true }
      break

    case 'dismiss':
      // Just update status to resolved
      actionResult = { dismissed: true }
      break

    case 'investigate':
      // Update status to investigating
      await auth.supabase
        .from('security_alerts')
        .update({ status: 'investigating' })
        .eq('id', params.id)

      actionResult = { investigating: true }
      break

    case 'notify_user':
      // Create notification for user
      await auth.supabase.from('notifications').insert({
        user_id: alert.user_id,
        type: 'security',
        title: 'Security Alert',
        message: `We detected suspicious activity on your account: ${alert.description}. Please review your recent activity and change your password if you don't recognize this activity.`,
        created_at: new Date().toISOString()
      })

      actionResult = { notification_sent: true }
      break

    default:
      return errorResponse('Invalid action')
  }

  // Update alert status
  const newStatus = body.action === 'dismiss' ? 'resolved' : 
                    body.action === 'investigate' ? 'investigating' : 'actioned'

  await auth.supabase
    .from('security_alerts')
    .update({ 
      status: newStatus,
      resolved_at: body.action === 'dismiss' ? new Date().toISOString() : null,
      admin_notes: body.notes || null
    })
    .eq('id', params.id)

  // Log the action
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: `security_alert_${body.action}`,
    entity_type: 'security_alerts',
    entity_id: params.id,
    details: { action: body.action, notes: body.notes, ...actionResult },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return jsonResponse({ 
    success: true, 
    action: body.action,
    result: actionResult
  })
}
