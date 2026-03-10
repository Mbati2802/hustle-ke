import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// DELETE /api/admin/sessions/[id] — Force logout user session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('user_sessions')
    .update({ 
      is_active: false,
      ended_at: new Date().toISOString(),
      ended_by: auth.profile.id
    })
    .eq('id', params.id)

  if (error) {
    console.error('[Admin Sessions] Force logout error:', error)
    return errorResponse('Failed to force logout session', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'force_logout_session',
    entity_type: 'user_sessions',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message: 'Session terminated successfully' })
}
