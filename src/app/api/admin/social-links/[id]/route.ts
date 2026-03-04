import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// PUT /api/admin/social-links/[id] — Update social link
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ name?: string; url?: string; icon?: string; is_active?: boolean; order_index?: number }>(req)
  if (!body || Object.keys(body).length === 0) {
    return errorResponse('At least one field to update is required')
  }

  const { data, error } = await auth.supabase
    .from('social_links')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update social link', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_social_link',
    entity_type: 'social_links',
    entity_id: params.id,
    details: { updated_fields: Object.keys(body) },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ link: data })
}

// DELETE /api/admin/social-links/[id] — Delete social link
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  // Get the link before deleting for logging
  const { data: link } = await auth.supabase
    .from('social_links')
    .select('name, url')
    .eq('id', params.id)
    .single()

  const { error } = await auth.supabase
    .from('social_links')
    .delete()
    .eq('id', params.id)

  if (error) return errorResponse('Failed to delete social link', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_social_link',
    entity_type: 'social_links',
    entity_id: params.id,
    details: { name: link?.name, url: link?.url },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ success: true })
}
