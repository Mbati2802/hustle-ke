import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/social-links — Get all social links
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: links, error } = await auth.supabase
    .from('social_links')
    .select('*')
    .order('order_index')
  
  if (error) return errorResponse('Failed to fetch social links', 500)
  return jsonResponse({ links })
}

// POST /api/admin/social-links — Create new social link
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ name: string; url: string; icon: string }>(req)
  if (!body?.name || !body?.url || !body?.icon) {
    return errorResponse('name, url, and icon are required')
  }

  // Get the highest order_index
  const { data: maxOrder } = await auth.supabase
    .from('social_links')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxOrder?.order_index || 0) + 1

  const { data, error } = await auth.supabase
    .from('social_links')
    .insert({
      name: body.name,
      url: body.url,
      icon: body.icon,
      order_index: nextOrder
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to create social link', 500)

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_social_link',
    entity_type: 'social_links',
    entity_id: data.id,
    details: { name: body.name, url: body.url },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ link: data })
}
