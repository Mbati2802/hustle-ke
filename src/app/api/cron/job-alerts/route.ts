import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// GET /api/cron/job-alerts — server-only cron endpoint to check all active saved searches and send alerts
// Requires CRON_SECRET env var for authentication
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return errorResponse('Cron endpoint not configured', 500)
  }

  const providedSecret = authHeader?.replace('Bearer ', '')
  if (providedSecret !== cronSecret) {
    return errorResponse('Unauthorized', 401)
  }

  const now = new Date().toISOString()
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // Get all active saved searches
  const { data: searches, error: sErr } = await adminDb
    .from('saved_searches')
    .select('*, user:profiles!user_id(id, full_name, email)')
    .eq('active', true)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(500)

  if (sErr) {
    console.error('[Cron Job Alerts] Failed to load searches:', sErr)
    return errorResponse('Failed to load saved searches', 500)
  }

  const results: Array<{ search_id: string; user_id: string; matches: number }> = []
  let totalNotifications = 0

  for (const s of searches || []) {
    const lastChecked = (s.last_checked_at as string | null) || s.created_at || null

    let q = adminDb
      .from('jobs')
      .select('id, title, created_at')
      .eq('status', 'Open')
      .order('created_at', { ascending: false })
      .limit(20)

    if (lastChecked) q = q.gt('created_at', lastChecked)

    if (s.query) {
      q = q.or(`title.ilike.%${s.query}%,description.ilike.%${s.query}%`)
    }
    if (Array.isArray(s.skills) && s.skills.length > 0) {
      q = q.overlaps('skills_required', s.skills)
    }
    if (s.enterprise_only) {
      q = q.not('organization_id', 'is', null)
    }
    if (s.remote_only) {
      q = q.eq('remote_allowed', true)
    }
    if (s.county) {
      q = q.eq('location_preference', s.county)
    }
    if (s.min_budget) {
      q = q.gte('budget_max', s.min_budget)
    }

    const { data: jobs, error: jErr } = await q
    if (jErr) {
      console.error(`[Cron Job Alerts] Failed to query jobs for search ${s.id}:`, jErr)
      continue
    }

    const matches = (jobs || []).length
    results.push({ search_id: s.id, user_id: s.user_id, matches })

    if (matches > 0) {
      const top = jobs![0]
      try {
        await sendNotification(adminDb as any, {
          userId: s.user_id,
          type: 'info',
          title: `New jobs for: ${s.name}`,
          message: `We found ${matches} new job(s) matching your saved search. Latest: ${top.title}`,
          link: '/jobs',
          metadata: { saved_search_id: s.id, matches, cron: true },
        })
        totalNotifications++
      } catch (err) {
        console.error(`[Cron Job Alerts] Failed to send notification for search ${s.id}:`, err)
      }
    }

    // Update last_checked_at
    await adminDb
      .from('saved_searches')
      .update({ last_checked_at: now, updated_at: now })
      .eq('id', s.id)
  }

  return jsonResponse({
    success: true,
    checked_at: now,
    searches_checked: (searches || []).length,
    notifications_sent: totalNotifications,
    results,
  })
}
