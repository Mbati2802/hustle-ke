import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

interface UpdateSavedSearchBody {
  name?: string
  active?: boolean
}

// DELETE /api/saved-searches/:id — delete my saved search
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id } = await params
  if (!id) return errorResponse('Missing id', 400)

  const { error } = await auth.supabase
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.profile.id)

  if (error) return errorResponse('Failed to delete saved search', 500)

  return jsonResponse({ success: true })
}

// PUT /api/saved-searches/:id — update (name/active)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { id } = await params
  if (!id) return errorResponse('Missing id', 400)

  const body = await parseBody<UpdateSavedSearchBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const patch: Record<string, any> = { updated_at: new Date().toISOString() }
  if (typeof body.name === 'string') patch.name = body.name.trim().slice(0, 80)
  if (typeof body.active === 'boolean') patch.active = body.active

  const { data, error } = await auth.supabase
    .from('saved_searches')
    .update(patch)
    .eq('id', id)
    .eq('user_id', auth.profile.id)
    .select('*')
    .single()

  if (error) return errorResponse('Failed to update saved search', 500)

  return jsonResponse({ savedSearch: data })
}
