import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// GET /api/blog/[slug] — Get single blog post by slug (public)
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const client = createPublicRouteClient(req)
  if (client.error) return client.error
  const supabase = client.supabase

  const { slug } = params

  // Fetch the post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*, profiles:author_id(full_name, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !post) return errorResponse('Blog post not found', 404)

  // Increment views (fire and forget)
  supabase
    .from('blog_posts')
    .update({ views: (post.views || 0) + 1 })
    .eq('id', post.id)
    .then(() => {})

  // Fetch related posts (same category, excluding current)
  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, category, published_at')
    .eq('is_published', true)
    .eq('category', post.category)
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(4)

  return jsonResponse({
    post,
    related: related || [],
  })
}
