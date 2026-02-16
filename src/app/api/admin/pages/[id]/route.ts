import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/pages/[id] — Get single page
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: page, error } = await auth.supabase
    .from('site_pages')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !page) return errorResponse('Page not found', 404)
  return jsonResponse({ page })
}

// PUT /api/admin/pages/[id] — Update page content
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    title?: string
    content?: Record<string, unknown>
    meta_title?: string
    meta_description?: string
    is_published?: boolean
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  const updateData: Record<string, unknown> = { updated_by: auth.profile.id }
  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content
  if (body.meta_title !== undefined) updateData.meta_title = body.meta_title
  if (body.meta_description !== undefined) updateData.meta_description = body.meta_description
  if (body.is_published !== undefined) updateData.is_published = body.is_published

  const { data: page, error } = await auth.supabase
    .from('site_pages')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update page', 500)

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_page',
    entity_type: 'site_pages',
    entity_id: params.id,
    details: { fields: Object.keys(updateData) },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ page })
}

// DELETE /api/admin/pages/[id] — Delete page
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('site_pages')
    .delete()
    .eq('id', params.id)

  if (error) return errorResponse('Failed to delete page', 500)

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_page',
    entity_type: 'site_pages',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ message: 'Page deleted' })
}
