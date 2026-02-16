import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/notifications/preferences — Get user's notification preferences
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: prefs } = await auth.adminDb
    .from('notification_preferences')
    .select('*')
    .eq('user_id', auth.profile.id)
    .single()

  if (prefs) {
    return jsonResponse({ preferences: prefs })
  }

  // Create defaults if none exist
  const defaults = {
    user_id: auth.profile.id,
    email_enabled: true,
    sms_enabled: true,
    push_enabled: true,
    job_alerts: true,
    message_alerts: true,
    proposal_alerts: true,
    subscription_alerts: true,
    escrow_alerts: true,
    marketing: false,
  }

  const { data: created } = await auth.adminDb
    .from('notification_preferences')
    .insert(defaults)
    .select()
    .single()

  return jsonResponse({ preferences: created || defaults })
}

// PUT /api/notifications/preferences — Update notification preferences
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const allowedFields = [
    'email_enabled', 'sms_enabled', 'push_enabled',
    'job_alerts', 'message_alerts', 'proposal_alerts',
    'subscription_alerts', 'escrow_alerts', 'marketing',
  ]

  const updateData: Record<string, boolean> = {}
  for (const field of allowedFields) {
    if (typeof (body as Record<string, unknown>)[field] === 'boolean') {
      updateData[field] = (body as Record<string, boolean>)[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return errorResponse('No valid preference fields provided', 400)
  }

  // Upsert: update if exists, insert if not
  const { data: existing } = await auth.adminDb
    .from('notification_preferences')
    .select('id')
    .eq('user_id', auth.profile.id)
    .single()

  if (existing) {
    const { data: updated, error } = await auth.adminDb
      .from('notification_preferences')
      .update(updateData)
      .eq('user_id', auth.profile.id)
      .select()
      .single()

    if (error) return errorResponse('Failed to update preferences', 500)
    return jsonResponse({ preferences: updated, message: 'Notification preferences saved' })
  }

  // Insert new
  const { data: created, error } = await auth.adminDb
    .from('notification_preferences')
    .insert({ user_id: auth.profile.id, ...updateData })
    .select()
    .single()

  if (error) return errorResponse('Failed to save preferences', 500)
  return jsonResponse({ preferences: created, message: 'Notification preferences saved' })
}
