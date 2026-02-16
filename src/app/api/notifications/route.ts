import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/notifications — Get user's notifications from DB
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const profileId = auth.profile.id

  // Fetch persisted notifications from DB (last 30 days, max 50)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: dbNotifications } = await auth.adminDb
    .from('notifications')
    .select('id, type, title, message, link, read, created_at')
    .eq('user_id', profileId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (dbNotifications || []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    type: n.type as string,
    title: n.title as string,
    message: n.message as string,
    link: (n.link as string) || '',
    read: n.read as boolean,
    created_at: n.created_at as string,
  }))

  const unreadCount = notifications.filter(n => !n.read).length

  return jsonResponse({ notifications, count: unreadCount })
}

// PUT /api/notifications — Mark notifications as read
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { ids, markAll } = body as { ids?: string[]; markAll?: boolean }

  if (markAll) {
    // Mark all as read
    await auth.adminDb
      .from('notifications')
      .update({ read: true })
      .eq('user_id', auth.profile.id)
      .eq('read', false)

    return jsonResponse({ message: 'All notifications marked as read' })
  }

  if (ids && Array.isArray(ids) && ids.length > 0) {
    await auth.adminDb
      .from('notifications')
      .update({ read: true })
      .eq('user_id', auth.profile.id)
      .in('id', ids)

    return jsonResponse({ message: `${ids.length} notification(s) marked as read` })
  }

  return errorResponse('Provide "ids" array or "markAll: true"', 400)
}
