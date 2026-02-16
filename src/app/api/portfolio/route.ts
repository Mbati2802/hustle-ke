import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody, createPublicRouteClient, getPagination } from '@/lib/api-utils'

// GET /api/portfolio?user_id=xxx — Get portfolio for a user (public)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('user_id')

  if (!userId) return errorResponse('user_id is required', 400)

  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  // Fetch categories with their items and images
  const { data: categories } = await supabase!
    .from('portfolio_categories')
    .select('id, name, description, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  const { data: items } = await supabase!
    .from('portfolio_items')
    .select('*, images:portfolio_images(id, url, alt_text, sort_order, is_cover)')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  // Group items by category
  const portfolio = (categories || []).map(cat => ({
    ...cat,
    items: (items || []).filter(item => item.category_id === cat.id),
  }))

  // Items without a category
  const uncategorized = (items || []).filter(item => !item.category_id)
  if (uncategorized.length > 0) {
    portfolio.push({
      id: 'uncategorized',
      name: 'Other Work',
      description: null,
      sort_order: 999,
      items: uncategorized,
    })
  }

  return jsonResponse({ portfolio, total_items: (items || []).length })
}

// POST /api/portfolio — Create a portfolio item
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { title, description, client_name, project_url, category_id, tags, is_featured } = body as Record<string, unknown>

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return errorResponse('Title is required (min 2 characters)', 400)
  }

  // Verify category belongs to user if provided
  if (category_id) {
    const { data: cat } = await auth.adminDb
      .from('portfolio_categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', auth.profile.id)
      .single()

    if (!cat) return errorResponse('Category not found', 404)
  }

  const { data: item, error } = await auth.adminDb
    .from('portfolio_items')
    .insert({
      user_id: auth.profile.id,
      title: (title as string).trim(),
      description: (description as string)?.trim() || null,
      client_name: (client_name as string)?.trim() || null,
      project_url: (project_url as string)?.trim() || null,
      category_id: category_id || null,
      tags: Array.isArray(tags) ? tags : [],
      is_featured: is_featured === true,
    })
    .select('*, images:portfolio_images(id, url, alt_text, sort_order, is_cover)')
    .single()

  if (error) return errorResponse('Failed to create portfolio item', 500)

  return jsonResponse({ item }, 201)
}
