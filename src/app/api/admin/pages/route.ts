import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/pages — List all site pages
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: pages, error } = await auth.supabase
    .from('site_pages')
    .select('*')
    .order('slug')

  if (error) return errorResponse('Failed to fetch pages', 500)
  return jsonResponse({ pages })
}

// POST /api/admin/pages — Create a new page
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    slug: string
    title: string
    content: Record<string, unknown>
    meta_title?: string
    meta_description?: string
    is_published?: boolean
    nav_category?: string
    sort_order?: number
  }>(req)

  if (!body || !body.slug || !body.title) {
    return errorResponse('slug and title are required')
  }

  const { data: page, error } = await auth.supabase
    .from('site_pages')
    .insert({
      slug: body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      title: body.title,
      content: body.content || {},
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || '',
      is_published: body.is_published ?? true,
      nav_category: body.nav_category || 'other',
      sort_order: body.sort_order ?? 0,
      updated_by: auth.profile.id,
    })
    .select()
    .single()

  if (error) {
    if (error.message.includes('duplicate')) return errorResponse('A page with this slug already exists', 409)
    return errorResponse('Failed to create page', 500)
  }

  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_page',
    entity_type: 'site_pages',
    entity_id: page.id,
    details: { slug: body.slug, title: body.title },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ page }, 201)
}
