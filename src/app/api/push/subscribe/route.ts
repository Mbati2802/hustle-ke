import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/push/subscribe — Register a push subscription
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const payload = body as Record<string, unknown>
  const subscription = payload.subscription as { endpoint: string; keys: { p256dh: string; auth: string } } | undefined

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return errorResponse('Invalid push subscription data', 400)
  }

  // Upsert subscription (one endpoint per user device)
  const { error } = await auth.adminDb
    .from('push_subscriptions')
    .upsert({
      user_id: auth.profile.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      user_agent: req.headers.get('user-agent') || '',
    }, {
      onConflict: 'endpoint',
    })

  if (error) {
    console.error('[Push Subscribe] Error:', error)
    return errorResponse('Failed to save subscription', 500)
  }

  return jsonResponse({ success: true })
}

// DELETE /api/push/subscribe — Unregister a push subscription
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const endpoint = url.searchParams.get('endpoint')

  if (!endpoint) return errorResponse('Endpoint required', 400)

  await auth.adminDb
    .from('push_subscriptions')
    .delete()
    .eq('user_id', auth.profile.id)
    .eq('endpoint', endpoint)

  return jsonResponse({ success: true })
}
