import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/saved-searches — admin stats for saved searches
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  // Total, active, inactive counts
  const { data: allSearches } = await auth.adminDb
    .from('saved_searches')
    .select('id, active, query')

  const total = (allSearches || []).length
  const active = (allSearches || []).filter((s) => s.active).length
  const inactive = total - active

  // Top queries (group by query, count)
  const queryMap = new Map<string, number>()
  for (const s of allSearches || []) {
    const q = (s.query || '').trim() || '(No keyword)'
    queryMap.set(q, (queryMap.get(q) || 0) + 1)
  }
  const top_queries = Array.from(queryMap.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Recent searches (last 20)
  const { data: recent } = await auth.adminDb
    .from('saved_searches')
    .select('id, name, query, active, created_at, last_checked_at, user:profiles!user_id(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(20)

  return jsonResponse({
    total,
    active,
    inactive,
    top_queries,
    recent: recent || [],
  })
}
