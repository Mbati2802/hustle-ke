import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/admin/broadcast — Send broadcast notification to users
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    target_audience?: 'all' | 'freelancers' | 'clients' | 'pro_users'
    user_ids?: string[]
    link?: string
  }>(req)

  if (!body || !body.title || !body.message) {
    return errorResponse('title and message are required')
  }

  let targetUserIds: string[] = []

  if (body.user_ids && body.user_ids.length > 0) {
    // Specific users
    targetUserIds = body.user_ids
  } else {
    // Get users based on target audience
    let query = auth.supabase.from('profiles').select('id')

    switch (body.target_audience) {
      case 'freelancers':
        query = query.eq('role', 'Freelancer')
        break
      case 'clients':
        query = query.eq('role', 'Client')
        break
      case 'pro_users':
        // Get users with active subscriptions
        const { data: subs } = await auth.supabase
          .from('subscriptions')
          .select('user_id')
          .eq('status', 'active')
        targetUserIds = subs?.map(s => s.user_id) || []
        break
      case 'all':
      default:
        // All users
        break
    }

    if (targetUserIds.length === 0 && body.target_audience !== 'pro_users') {
      const { data: users } = await query
      targetUserIds = users?.map(u => u.id) || []
    }
  }

  if (targetUserIds.length === 0) {
    return errorResponse('No users found for the selected audience')
  }

  // Create notifications for all target users
  const notifications = targetUserIds.map(userId => ({
    user_id: userId,
    type: body.type || 'info',
    title: body.title,
    message: body.message,
    link: body.link,
    metadata: {
      broadcast: true,
      sent_by: auth.profile.id,
      sent_by_name: auth.profile.full_name
    }
  }))

  const { error } = await auth.supabase
    .from('notifications')
    .insert(notifications)

  if (error) {
    console.error('[Admin Broadcast] Error:', error)
    return errorResponse('Failed to send broadcast notification', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'send_broadcast',
    entity_type: 'notifications',
    details: {
      title: body.title,
      target_audience: body.target_audience,
      recipient_count: targetUserIds.length
    },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({
    message: 'Broadcast sent successfully',
    recipient_count: targetUserIds.length
  })
}

// GET /api/admin/broadcast — Get broadcast history
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: broadcasts } = await auth.supabase
    .from('activity_log')
    .select('*')
    .eq('action', 'send_broadcast')
    .order('created_at', { ascending: false })
    .limit(50)

  return jsonResponse({ broadcasts: broadcasts || [] })
}
