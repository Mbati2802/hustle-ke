import { NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { createAdminClient } from '@/lib/supabase'

// POST /api/admin/users/[id]/actions — Admin actions on users
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: 'ban' | 'unban' | 'suspend' | 'unsuspend' | 'reset_password' | 'force_logout' | 'adjust_wallet' | 'send_notification'
    duration?: number // For suspend (in days)
    amount?: number // For wallet adjustment
    reason?: string
    message?: string // For notification
    title?: string // For notification
  }>(req)

  if (!body || !body.action) {
    return errorResponse('Action is required')
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('*, wallets(*)')
    .eq('id', params.id)
    .single()

  if (profileError || !profile) {
    return errorResponse('User not found', 404)
  }

  let actionResult: any = {}

  switch (body.action) {
    case 'ban':
      await auth.supabase
        .from('profiles')
        .update({ 
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: body.reason || 'Banned by admin'
        })
        .eq('id', params.id)

      // Force logout all sessions
      await auth.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', params.id)

      actionResult = { banned: true }
      break

    case 'unban':
      await auth.supabase
        .from('profiles')
        .update({ 
          is_banned: false,
          banned_at: null,
          ban_reason: null
        })
        .eq('id', params.id)

      actionResult = { unbanned: true }
      break

    case 'suspend':
      const suspendUntil = new Date()
      suspendUntil.setDate(suspendUntil.getDate() + (body.duration || 7))

      await auth.supabase
        .from('profiles')
        .update({ 
          is_suspended: true,
          suspended_until: suspendUntil.toISOString(),
          suspension_reason: body.reason || 'Suspended by admin'
        })
        .eq('id', params.id)

      // Force logout
      await auth.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', params.id)

      actionResult = { suspended: true, until: suspendUntil }
      break

    case 'unsuspend':
      await auth.supabase
        .from('profiles')
        .update({ 
          is_suspended: false,
          suspended_until: null,
          suspension_reason: null
        })
        .eq('id', params.id)

      actionResult = { unsuspended: true }
      break

    case 'reset_password':
      const adminClient = createAdminClient()
      const { error: resetError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: profile.email,
      })

      if (resetError) {
        return errorResponse('Failed to send password reset', 500)
      }

      actionResult = { password_reset_sent: true, email: profile.email }
      break

    case 'force_logout':
      const { error: logoutError } = await auth.supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', params.id)

      if (logoutError) {
        return errorResponse('Failed to force logout', 500)
      }

      actionResult = { logged_out: true }
      break

    case 'adjust_wallet':
      if (!body.amount || body.amount === 0) {
        return errorResponse('Amount is required for wallet adjustment')
      }

      const wallet = profile.wallets?.[0]
      if (!wallet) {
        return errorResponse('User has no wallet', 404)
      }

      // Create adjustment transaction
      const { error: txError } = await auth.supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: body.amount > 0 ? 'Credit' : 'Debit',
          amount: Math.abs(body.amount),
          status: 'Completed',
          description: `Admin adjustment: ${body.reason || 'Manual adjustment'}`,
          metadata: {
            admin_id: auth.profile.id,
            admin_name: auth.profile.full_name,
            reason: body.reason
          },
          created_at: new Date().toISOString()
        })

      if (txError) {
        return errorResponse('Failed to adjust wallet', 500)
      }

      // Update wallet balance
      await auth.supabase
        .from('wallets')
        .update({ 
          balance: wallet.balance + body.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

      actionResult = { 
        wallet_adjusted: true, 
        amount: body.amount,
        new_balance: wallet.balance + body.amount
      }
      break

    case 'send_notification':
      if (!body.message || !body.title) {
        return errorResponse('Title and message are required for notification')
      }

      await auth.supabase.from('notifications').insert({
        user_id: params.id,
        type: 'admin_message',
        title: body.title,
        message: body.message,
        metadata: {
          admin_id: auth.profile.id,
          admin_name: auth.profile.full_name
        },
        created_at: new Date().toISOString()
      })

      actionResult = { notification_sent: true }
      break

    default:
      return errorResponse('Invalid action')
  }

  // Log the action
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: `user_${body.action}`,
    entity_type: 'profiles',
    entity_id: params.id,
    details: { 
      action: body.action, 
      reason: body.reason,
      ...actionResult 
    },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  // Invalidate caches
  revalidatePath('/talent')
  revalidatePath(`/talent/${params.id}`)
  revalidateTag(`user-${params.id}`)

  return jsonResponse({ 
    success: true, 
    action: body.action,
    result: actionResult
  })
}
