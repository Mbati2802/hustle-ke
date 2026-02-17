import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  // Use public client with RLS - counts are public information
  const [{ count: totalUsers }, { count: totalJobs }] = await Promise.all([
    supabase!.from('profiles').select('*', { count: 'exact', head: true }),
    supabase!.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
  ])

  return jsonResponse({
    total_users: totalUsers || 0,
    total_jobs: totalJobs || 0,
  })
}
