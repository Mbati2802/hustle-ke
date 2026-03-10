import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// DELETE /api/admin/mfa/[userId] — Reset user's MFA
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  // Get user info first
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', params.userId)
    .single()

  if (!profile) {
    return errorResponse('User not found', 404)
  }

  // Delete MFA secret
  const { error } = await auth.supabase
    .from('mfa_secrets')
    .delete()
    .eq('user_id', params.userId)

  if (error) {
    console.error('[Admin MFA] Reset error:', error)
    return errorResponse('Failed to reset MFA', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'reset_user_mfa',
    entity_type: 'mfa_secrets',
    entity_id: params.userId,
    details: {
      user_name: profile.full_name,
      user_email: profile.email
    },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message: 'MFA reset successfully' })
}
