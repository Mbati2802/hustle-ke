import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(`public:${ip}`, RATE_LIMITS.api)
  if (!rl.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return errorResponse('Server not configured', 500)
  }

  const adminDb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const [{ count: totalUsers }, { count: totalJobs }] = await Promise.all([
    adminDb.from('profiles').select('*', { count: 'exact', head: true }),
    adminDb.from('jobs').select('*', { count: 'exact', head: true }),
  ])

  return jsonResponse({
    total_users: totalUsers || 0,
    total_jobs: totalJobs || 0,
  })
}
