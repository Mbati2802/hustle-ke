import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// PUT /api/admin/reviews/[id] — Moderate review (toggle visibility, edit)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<Record<string, unknown>>(req)
  if (!body) return errorResponse('Invalid request body')

  const allowedFields = ['is_public', 'admin_note', 'rating', 'comment', 'communication_rating', 'quality_rating', 'timeliness_rating']
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) updateData[key] = body[key]
  }

  if (Object.keys(updateData).length === 0) return errorResponse('No fields to update')

  const { data: review, error } = await auth.supabase
    .from('reviews')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update review', 500)

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: body.is_public === false ? 'hide_review' : 'update_review',
    entity_type: 'reviews',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ review })
}

// DELETE /api/admin/reviews/[id] — Delete review
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase.from('reviews').delete().eq('id', params.id)
  if (error) return errorResponse('Failed to delete review', 500)

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_review',
    entity_type: 'reviews',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ message: 'Review deleted' })
}
