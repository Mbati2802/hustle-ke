import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/settings — Get all site settings
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const category = url.searchParams.get('category')

  let query = auth.supabase.from('site_settings').select('*')
  if (category) query = query.eq('category', category)
  query = query.order('category').order('key')

  const { data: settings, error } = await query
  if (error) return errorResponse('Failed to fetch settings', 500)

  return jsonResponse({ settings })
}

// PUT /api/admin/settings — Update settings (batch)
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ settings: Array<{ key: string; value: unknown }> }>(req)
  if (!body || !body.settings || !Array.isArray(body.settings)) {
    return errorResponse('settings array is required')
  }

  const results = []
  for (const s of body.settings) {
    if (!s.key) continue
    const { data, error } = await auth.supabase
      .from('site_settings')
      .update({ value: JSON.stringify(s.value), updated_by: auth.profile.id })
      .eq('key', s.key)
      .select()
      .single()
    if (error) {
      results.push({ key: s.key, error: error.message })
    } else {
      results.push({ key: s.key, success: true, data })
    }
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_settings',
    entity_type: 'site_settings',
    details: { keys: body.settings.map(s => s.key) },
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
  })

  return jsonResponse({ results })
}
