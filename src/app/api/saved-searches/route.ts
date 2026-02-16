import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody, getPagination } from '@/lib/api-utils'

interface CreateSavedSearchBody {
  name?: string
  query?: string
  skills?: string[]
  county?: string
  remote_only?: boolean
  enterprise_only?: boolean
  min_budget?: number
}

// GET /api/saved-searches — list my saved searches
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req, 50)

  const { data, error, count } = await auth.supabase
    .from('saved_searches')
    .select('*', { count: 'exact' })
    .eq('user_id', auth.profile.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return errorResponse('Failed to fetch saved searches', 500)

  return jsonResponse({
    savedSearches: data || [],
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}

// POST /api/saved-searches — create saved search
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<CreateSavedSearchBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const name = (body.name || '').toString().trim()
  if (!name || name.length < 2) return errorResponse('Name is required', 400)

  const skills = Array.isArray(body.skills) ? body.skills.filter(Boolean).slice(0, 25) : []

  const { data, error } = await auth.supabase
    .from('saved_searches')
    .insert({
      user_id: auth.profile.id,
      name: name.slice(0, 80),
      query: body.query?.toString().trim().slice(0, 200) || null,
      skills,
      county: body.county?.toString().trim().slice(0, 80) || null,
      remote_only: !!body.remote_only,
      enterprise_only: !!body.enterprise_only,
      min_budget: typeof body.min_budget === 'number' ? Math.max(0, Math.round(body.min_budget)) : null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[Saved Searches] create error:', error)
    return errorResponse('Failed to create saved search', 500)
  }

  return jsonResponse({ savedSearch: data }, 201)
}
