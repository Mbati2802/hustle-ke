import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// GET /api/blog — List published blog posts (public, no auth required)
export async function GET(req: NextRequest) {
  const client = createPublicRouteClient(req)
  if (client.error) return client.error
  const supabase = client.supabase

  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const tag = url.searchParams.get('tag')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, tags, published_at, views, author_id, profiles:author_id(full_name, avatar_url)', { count: 'exact' })
    .eq('is_published', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  query = query.range(offset, offset + limit - 1)

  const { data: posts, error, count } = await query

  if (error) return errorResponse('Failed to fetch blog posts', 500)

  // Get unique categories for filter
  const { data: allPosts } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('is_published', true)

  const catSet = new Set<string>()
  ;(allPosts || []).forEach((p: { category: string }) => catSet.add(p.category))
  const categories = Array.from(catSet).sort()

  return jsonResponse({
    posts: posts || [],
    categories,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
