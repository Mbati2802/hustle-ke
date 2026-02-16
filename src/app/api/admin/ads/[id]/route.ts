import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// PUT /api/admin/ads/[id] — Update an internal ad (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const updates: Record<string, any> = {}
  const allowedFields = [
    'title', 'description', 'cta_text', 'cta_link', 'target_audience',
    'ad_type', 'icon', 'color_scheme', 'image_url', 'priority',
    'is_active', 'start_date', 'end_date',
  ]

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('No fields to update')
  }

  updates.updated_at = new Date().toISOString()

  const { data: ad, error } = await auth.adminDb
    .from('internal_ads')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[Admin Ads] Update error:', error)
    return errorResponse('Failed to update ad', 500)
  }

  return jsonResponse({ ad })
}

// DELETE /api/admin/ads/[id] — Delete an internal ad (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.adminDb
    .from('internal_ads')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[Admin Ads] Delete error:', error)
    return errorResponse('Failed to delete ad', 500)
  }

  return jsonResponse({ success: true })
}
