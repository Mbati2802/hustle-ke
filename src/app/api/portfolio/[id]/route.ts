import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// PUT /api/portfolio/[id] — Update a portfolio item
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: existing } = await auth.adminDb
    .from('portfolio_items')
    .select('id, user_id')
    .eq('id', params.id)
    .single()

  if (!existing) return errorResponse('Portfolio item not found', 404)
  if (existing.user_id !== auth.profile.id) return errorResponse('Not your portfolio item', 403)

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { title, description, client_name, project_url, category_id, tags, is_featured, sort_order } = body as Record<string, unknown>

  const updateData: Record<string, unknown> = {}
  if (title !== undefined) updateData.title = (title as string).trim()
  if (description !== undefined) updateData.description = (description as string)?.trim() || null
  if (client_name !== undefined) updateData.client_name = (client_name as string)?.trim() || null
  if (project_url !== undefined) updateData.project_url = (project_url as string)?.trim() || null
  if (category_id !== undefined) updateData.category_id = category_id || null
  if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []
  if (is_featured !== undefined) updateData.is_featured = is_featured === true
  if (sort_order !== undefined) updateData.sort_order = sort_order

  const { data: item, error } = await auth.adminDb
    .from('portfolio_items')
    .update(updateData)
    .eq('id', params.id)
    .select('*, images:portfolio_images(id, url, alt_text, sort_order, is_cover)')
    .single()

  if (error) return errorResponse('Failed to update', 500)

  return jsonResponse({ item })
}

// DELETE /api/portfolio/[id] — Delete a portfolio item and its images
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: existing } = await auth.adminDb
    .from('portfolio_items')
    .select('id, user_id')
    .eq('id', params.id)
    .single()

  if (!existing) return errorResponse('Portfolio item not found', 404)
  if (existing.user_id !== auth.profile.id) return errorResponse('Not your portfolio item', 403)

  // Delete images from storage
  const { data: images } = await auth.adminDb
    .from('portfolio_images')
    .select('storage_path')
    .eq('item_id', params.id)

  if (images && images.length > 0) {
    const paths = images.map(img => img.storage_path)
    await auth.adminDb.storage.from('portfolio').remove(paths)
  }

  // Delete item (cascade deletes portfolio_images rows)
  const { error } = await auth.adminDb
    .from('portfolio_items')
    .delete()
    .eq('id', params.id)

  if (error) return errorResponse('Failed to delete', 500)

  return jsonResponse({ message: 'Portfolio item deleted' })
}
