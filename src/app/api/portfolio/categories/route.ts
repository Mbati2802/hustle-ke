import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/portfolio/categories — Get current user's portfolio categories
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: categories, error } = await auth.adminDb
    .from('portfolio_categories')
    .select('id, name, description, sort_order')
    .eq('user_id', auth.profile.id)
    .order('sort_order', { ascending: true })

  if (error) return errorResponse('Failed to fetch categories', 500)

  return jsonResponse({ categories: categories || [] })
}

// POST /api/portfolio/categories — Create a new category
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { name, description } = body as Record<string, string>

  if (!name || name.trim().length < 2) {
    return errorResponse('Category name is required (min 2 characters)', 400)
  }

  // Check max 20 categories
  const { count } = await auth.adminDb
    .from('portfolio_categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.profile.id)

  if ((count || 0) >= 20) {
    return errorResponse('Maximum 20 categories allowed', 400)
  }

  const { data: category, error } = await auth.adminDb
    .from('portfolio_categories')
    .insert({
      user_id: auth.profile.id,
      name: name.trim(),
      description: description?.trim() || null,
      sort_order: (count || 0),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return errorResponse('You already have a category with this name', 409)
    return errorResponse('Failed to create category', 500)
  }

  return jsonResponse({ category }, 201)
}

// PUT /api/portfolio/categories — Update a category
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { id, name, description, sort_order } = body as Record<string, unknown>

  if (!id) return errorResponse('Category id is required', 400)

  const { data: existing } = await auth.adminDb
    .from('portfolio_categories')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return errorResponse('Category not found', 404)
  if (existing.user_id !== auth.profile.id) return errorResponse('Not your category', 403)

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = (name as string).trim()
  if (description !== undefined) updateData.description = (description as string)?.trim() || null
  if (sort_order !== undefined) updateData.sort_order = sort_order

  const { data: category, error } = await auth.adminDb
    .from('portfolio_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return errorResponse('Failed to update category', 500)

  return jsonResponse({ category })
}

// DELETE /api/portfolio/categories — Delete a category (items become uncategorized)
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) return errorResponse('Category id is required', 400)

  const { data: existing } = await auth.adminDb
    .from('portfolio_categories')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (!existing) return errorResponse('Category not found', 404)
  if (existing.user_id !== auth.profile.id) return errorResponse('Not your category', 403)

  const { error } = await auth.adminDb
    .from('portfolio_categories')
    .delete()
    .eq('id', id)

  if (error) return errorResponse('Failed to delete category', 500)

  return jsonResponse({ message: 'Category deleted' })
}
