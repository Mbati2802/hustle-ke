import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// POST /api/portfolio/[id]/images — Upload image(s) to a portfolio item
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Verify item exists and belongs to user
  const { data: item } = await auth.adminDb
    .from('portfolio_items')
    .select('id, user_id')
    .eq('id', params.id)
    .single()

  if (!item) return errorResponse('Portfolio item not found', 404)
  if (item.user_id !== auth.profile.id) return errorResponse('Not your portfolio item', 403)

  // Check existing image count (max 10 per item)
  const { count: existingCount } = await auth.adminDb
    .from('portfolio_images')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', params.id)

  if ((existingCount || 0) >= 10) {
    return errorResponse('Maximum 10 images per portfolio item', 400)
  }

  // Parse multipart form data
  const formData = await req.formData()
  const files = formData.getAll('images') as File[]

  if (!files || files.length === 0) {
    return errorResponse('No images provided. Use form field "images"', 400)
  }

  // Validate all files before uploading
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`, 400)
    }
    if (file.size > maxSize) {
      return errorResponse(`File "${file.name}" exceeds 5MB limit`, 400)
    }
  }

  // Ensure bucket exists
  const { data: buckets } = await auth.adminDb.storage.listBuckets()
  if (!buckets?.find(b => b.id === 'portfolio')) {
    await auth.adminDb.storage.createBucket('portfolio', {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
  }

  const remaining = 10 - (existingCount || 0)
  const filesToUpload = files.slice(0, remaining)

  const uploaded: Array<{ id: string; url: string; alt_text: string | null }> = []

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i]
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const storagePath = `${auth.profile.id}/${params.id}/${timestamp}_${i}.${ext}`

    // Upload to Supabase Storage
    const { error: uploadErr } = await auth.adminDb.storage
      .from('portfolio')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      console.error('[Portfolio] Upload error:', uploadErr)
      continue
    }

    // Get public URL
    const { data: urlData } = auth.adminDb.storage
      .from('portfolio')
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl

    // Save to DB
    const { data: image, error: dbErr } = await auth.adminDb
      .from('portfolio_images')
      .insert({
        item_id: params.id,
        user_id: auth.profile.id,
        url: publicUrl,
        storage_path: storagePath,
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
        sort_order: (existingCount || 0) + i,
        is_cover: (existingCount || 0) === 0 && i === 0, // First image is cover
      })
      .select()
      .single()

    if (!dbErr && image) {
      uploaded.push({ id: image.id, url: image.url, alt_text: image.alt_text })
    }
  }

  if (uploaded.length === 0) {
    return errorResponse('Failed to upload images', 500)
  }

  return jsonResponse({ images: uploaded, count: uploaded.length }, 201)
}

// DELETE /api/portfolio/[id]/images?image_id=xxx — Delete an image
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const imageId = url.searchParams.get('image_id')

  if (!imageId) return errorResponse('image_id query param is required', 400)

  const { data: image } = await auth.adminDb
    .from('portfolio_images')
    .select('id, user_id, storage_path')
    .eq('id', imageId)
    .eq('item_id', params.id)
    .single()

  if (!image) return errorResponse('Image not found', 404)
  if (image.user_id !== auth.profile.id) return errorResponse('Not your image', 403)

  // Delete from storage
  await auth.adminDb.storage.from('portfolio').remove([image.storage_path])

  // Delete from DB
  await auth.adminDb
    .from('portfolio_images')
    .delete()
    .eq('id', imageId)

  return jsonResponse({ message: 'Image deleted' })
}
