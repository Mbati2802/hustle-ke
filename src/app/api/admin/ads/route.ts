import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/ads — List all internal ads (admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const activeOnly = url.searchParams.get('active') === 'true'

  let query = auth.adminDb
    .from('internal_ads')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data: ads, error } = await query

  if (error) return errorResponse('Failed to fetch ads', 500)

  return jsonResponse({ ads })
}

// POST /api/admin/ads — Create a new internal ad (admin only)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const {
    title,
    description,
    cta_text,
    cta_link,
    target_audience,
    ad_type,
    icon,
    color_scheme,
    image_url,
    priority,
    is_active,
    start_date,
    end_date,
  } = body

  if (!title || !description) {
    return errorResponse('Title and description are required')
  }

  const { data: ad, error } = await auth.adminDb
    .from('internal_ads')
    .insert({
      title,
      description,
      cta_text: cta_text || 'Learn More',
      cta_link: cta_link || '/',
      target_audience: target_audience || 'all',
      ad_type: ad_type || 'card',
      icon: icon || null,
      color_scheme: color_scheme || 'green',
      image_url: image_url || null,
      priority: priority || 0,
      is_active: is_active !== false,
      is_system_generated: false,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: auth.profile.id,
    })
    .select()
    .single()

  if (error) {
    console.error('[Admin Ads] Create error:', error)
    return errorResponse('Failed to create ad', 500)
  }

  return jsonResponse({ ad }, 201)
}
