import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/users/simple — Get simple list of admin users for assignment dropdown
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: admins, error } = await auth.adminDb
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'Admin')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[Admin Users Simple] fetch error:', error)
    return errorResponse('Failed to fetch admin users', 500)
  }

  return jsonResponse({ admins: admins || [] })
}
