import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// POST /api/job-alerts/check — checks active saved searches and notifies user about new matching jobs
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const now = new Date().toISOString()

  const { data: searches, error: sErr } = await auth.adminDb
    .from('saved_searches')
    .select('*')
    .eq('user_id', auth.profile.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (sErr) return errorResponse('Failed to load saved searches', 500)

  const results: Array<{ search_id: string; matches: number }> = []

  for (const s of searches || []) {
    const lastChecked = (s.last_checked_at as string | null) || s.created_at || null

    let q = auth.adminDb
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
    if (jErr) continue

    const matches = (jobs || []).length
    results.push({ search_id: s.id, matches })

    if (matches > 0) {
      const top = jobs![0]
      await sendNotification(auth.adminDb as any, {
        userId: auth.profile.id,
        type: 'info',
        title: `New jobs for: ${s.name}`,
        message: `We found ${matches} new job(s) matching your saved search. Latest: ${top.title}`,
        link: '/jobs',
        metadata: { saved_search_id: s.id, matches },
      } as any)
    }

    await auth.adminDb
      .from('saved_searches')
      .update({ last_checked_at: now, updated_at: now })
      .eq('id', s.id)
      .eq('user_id', auth.profile.id)
  }

  return jsonResponse({ checked_at: now, results })
}
