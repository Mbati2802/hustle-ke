import { NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/blog/[id] — Get blog post details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: post, error } = await auth.supabase
    .from('blog_posts')
    .select(`
      *,
      author:profiles!author_id(
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !post) return errorResponse('Blog post not found', 404)

  return jsonResponse({ post })
}

// PUT /api/admin/blog/[id] — Update blog post
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    featured_image?: string
    status?: 'draft' | 'published'
    meta_title?: string
    meta_description?: string
    tags?: string[]
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  // If slug is being changed, check for conflicts
  if (body.slug) {
    const { data: existing } = await auth.supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', body.slug)
      .neq('id', params.id)
      .single()

    if (existing) {
      return errorResponse('A post with this slug already exists', 409)
    }
  }

  const updateData: Record<string, any> = {}
  if (body.title) updateData.title = body.title
  if (body.slug) updateData.slug = body.slug
  if (body.excerpt !== undefined) updateData.excerpt = body.excerpt
  if (body.content) updateData.content = body.content
  if (body.featured_image !== undefined) updateData.featured_image = body.featured_image
  if (body.meta_title) updateData.meta_title = body.meta_title
  if (body.meta_description) updateData.meta_description = body.meta_description
  if (body.tags) updateData.tags = body.tags

  // Handle status change
  if (body.status) {
    updateData.status = body.status
    // Set published_at when publishing for the first time
    if (body.status === 'published') {
      const { data: current } = await auth.supabase
        .from('blog_posts')
        .select('published_at')
        .eq('id', params.id)
        .single()

      if (current && !current.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }
  }

  const { data: post, error } = await auth.supabase
    .from('blog_posts')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[Admin Blog] Update error:', error)
    return errorResponse('Failed to update blog post', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'update_blog_post',
    entity_type: 'blog_posts',
    entity_id: params.id,
    details: { slug: updateData.slug, is_published: updateData.status === 'published' },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
  })

  // Invalidate blog caches so changes appear immediately
  revalidatePath('/blog')
  if (post.slug) revalidatePath(`/blog/${post.slug}`)
  revalidateTag('blog-posts')
  revalidateTag(`blog-${params.id}`)

  return jsonResponse({ post })
}

// DELETE /api/admin/blog/[id] — Delete blog post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('blog_posts')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[Admin Blog] Delete error:', error)
    return errorResponse('Failed to delete blog post', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'delete_blog_post',
    entity_type: 'blog_posts',
    entity_id: params.id,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ message: 'Blog post deleted successfully' })
}
