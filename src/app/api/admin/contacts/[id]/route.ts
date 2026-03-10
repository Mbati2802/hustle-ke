import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/contacts/[id] — Get contact message details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: message, error } = await auth.supabase
    .from('contact_messages')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !message) return errorResponse('Contact message not found', 404)

  // Mark as read if it's new
  if (message.status === 'new') {
    await auth.supabase
      .from('contact_messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  return jsonResponse({ message })
}

// PUT /api/admin/contacts/[id] — Update contact message status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    status?: 'new' | 'read' | 'replied' | 'spam'
    admin_notes?: string
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  const updateData: Record<string, any> = {}
  if (body.status) updateData.status = body.status
  if (body.admin_notes) updateData.admin_notes = body.admin_notes

  if (body.status === 'replied') {
    updateData.replied_at = new Date().toISOString()
    updateData.replied_by = auth.profile.id
  }

  const { data: message, error } = await auth.supabase
    .from('contact_messages')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[Admin Contacts] Update error:', error)
    return errorResponse('Failed to update contact message', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_contact_message',
    entity_type: 'contact_messages',
    entity_id: params.id,
    details: updateData,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message })
}

// POST /api/admin/contacts/[id] — Send reply to contact message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ reply_message: string; subject?: string }>(req)
  if (!body?.reply_message?.trim()) return errorResponse('Reply message is required')

  const { data: message, error } = await auth.supabase
    .from('contact_messages')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !message) return errorResponse('Contact message not found', 404)

  const replyThread = {
    admin_name: auth.profile.full_name,
    admin_id: auth.profile.id,
    message: body.reply_message,
    sent_at: new Date().toISOString(),
    subject: body.subject || `Re: ${message.subject}`,
  }

  const existingReplies = Array.isArray(message.replies) ? message.replies : []

  const { error: updateError } = await auth.supabase
    .from('contact_messages')
    .update({
      status: 'replied',
      replied_at: new Date().toISOString(),
      replied_by: auth.profile.id,
      replies: [...existingReplies, replyThread],
    })
    .eq('id', params.id)

  if (updateError) return errorResponse('Failed to save reply', 500)

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'reply_contact_message',
    entity_type: 'contact_messages',
    entity_id: params.id,
    details: { recipient_email: message.email, subject: replyThread.subject },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({
    message: 'Reply sent successfully',
    reply: replyThread,
    recipient_email: message.email
  })
}

// DELETE /api/admin/contacts/[id] — Delete contact message (mark as spam)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('contact_messages')
    .update({ status: 'spam' })
    .eq('id', params.id)

  if (error) {
    console.error('[Admin Contacts] Delete error:', error)
    return errorResponse('Failed to mark as spam', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'mark_contact_spam',
    entity_type: 'contact_messages',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message: 'Marked as spam' })
}
