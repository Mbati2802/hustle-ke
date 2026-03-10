import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/mfa — Get MFA statistics and users with MFA enabled
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const search = url.searchParams.get('search')

  // Get all MFA secrets
  let query = auth.supabase
    .from('mfa_secrets')
    .select(`
      *,
      profile:profiles!user_id(
        id,
        full_name,
        email,
        role,
        avatar_url
      )
    `)
    .eq('is_verified', true)

  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const { data: mfaUsers, error } = await query

  if (error) {
    console.error('[Admin MFA] Fetch error:', error)
    return errorResponse('Failed to fetch MFA data', 500)
  }

  // Get total user count
  const { count: totalUsers } = await auth.supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const mfaEnabledCount = mfaUsers?.length || 0
  const adoptionRate = totalUsers ? ((mfaEnabledCount / totalUsers) * 100).toFixed(1) : 0

  return jsonResponse({
    mfa_users: mfaUsers || [],
    stats: {
      total_users: totalUsers || 0,
      mfa_enabled: mfaEnabledCount,
      adoption_rate: parseFloat(adoptionRate as string)
    }
  })
}
