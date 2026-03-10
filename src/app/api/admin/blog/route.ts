import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination, parseBody } from '@/lib/api-utils'

// GET /api/admin/blog — List all blog posts
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('blog_posts')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        email,
        avatar_url
      )
    `, { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'title':
      query = query.order('title', { ascending: true })
      break
    case 'views':
      query = query.order('views', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: posts, error, count } = await query

  if (error) {
    console.error('[Admin Blog] Fetch error:', error)
    return errorResponse('Failed to fetch blog posts', 500)
  }

  // Get statistics
  const { data: allPosts } = await auth.supabase
    .from('blog_posts')
    .select('status, views')

  const publishedCount = allPosts?.filter(p => p.status === 'published').length || 0
  const draftCount = allPosts?.filter(p => p.status === 'draft').length || 0
  const totalViews = allPosts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0

  return jsonResponse({
    posts,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      published: publishedCount,
      draft: draftCount,
      total_views: totalViews
    }
  })
}

// POST /api/admin/blog — Create new blog post
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    title: string
    slug: string
    excerpt?: string
    content: string
    featured_image?: string
    status?: 'draft' | 'published'
    meta_title?: string
    meta_description?: string
    tags?: string[]
  }>(req)

  if (!body || !body.title || !body.slug || !body.content) {
    return errorResponse('title, slug, and content are required')
  }

  // Check if slug already exists
  const { data: existing } = await auth.supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', body.slug)
    .single()

  if (existing) {
    return errorResponse('A post with this slug already exists', 409)
  }

  const { data: post, error } = await auth.supabase
    .from('blog_posts')
    .insert({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featured_image: body.featured_image,
      status: body.status || 'draft',
      author_id: auth.profile.id,
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.excerpt,
      tags: body.tags || [],
      published_at: body.status === 'published' ? new Date().toISOString() : null
    })
    .select()
    .single()

  if (error) {
    console.error('[Admin Blog] Create error:', error)
    return errorResponse('Failed to create blog post', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'create_blog_post',
    entity_type: 'blog_posts',
    entity_id: post.id,
    details: { title: body.title, status: body.status },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ post }, 201)
}
