import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// Allow uploads up to 4MB
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/profile/avatar — Upload or replace profile avatar
export async function POST(req: NextRequest) {
  console.log('[Avatar] Upload request received')
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const formData = await req.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    console.error('[Avatar] No file in form data')
    return errorResponse('No file provided. Use form field "avatar"', 400)
  }
  console.log('[Avatar] File received:', file.name, file.type, file.size, 'bytes')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return errorResponse('Invalid file type. Allowed: JPEG, PNG, WebP', 400)
  }

  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return errorResponse('File exceeds 2MB limit', 400)
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `${auth.profile.id}/avatar.${ext}`

  // Ensure bucket exists
  const { data: buckets, error: bucketsErr } = await auth.adminDb.storage.listBuckets()
  if (bucketsErr) {
    console.error('[Avatar] Failed to list buckets:', bucketsErr)
  }
  if (!buckets?.find(b => b.id === 'avatars')) {
    const { error: createErr } = await auth.adminDb.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 2097152,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (createErr) {
      console.error('[Avatar] Failed to create bucket:', createErr)
    }
  }

  // Delete any existing avatar files for this user
  const { data: existingFiles } = await auth.adminDb.storage
    .from('avatars')
    .list(auth.profile.id)

  if (existingFiles && existingFiles.length > 0) {
    const paths = existingFiles.map(f => `${auth.profile.id}/${f.name}`)
    await auth.adminDb.storage.from('avatars').remove(paths)
  }

  // Convert File to Buffer (Next.js App Router File objects need conversion for Supabase)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload new avatar
  const { error: uploadErr } = await auth.adminDb.storage
    .from('avatars')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadErr) {
    console.error('[Avatar] Upload error:', uploadErr)
    return errorResponse('Failed to upload avatar', 500)
  }

  // Get public URL
  const { data: urlData } = auth.adminDb.storage
    .from('avatars')
    .getPublicUrl(storagePath)

  const avatarUrl = urlData.publicUrl
  console.log('[Avatar] Public URL:', avatarUrl)

  // Update profile with new avatar URL
  const { error: updateErr } = await auth.adminDb
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', auth.profile.id)

  if (updateErr) {
    console.error('[Avatar] Profile update error:', updateErr)
    return errorResponse('Failed to update profile', 500)
  }

  console.log('[Avatar] Success for user:', auth.profile.id)
  return jsonResponse({ avatar_url: avatarUrl, message: 'Avatar updated' })
}

// DELETE /api/profile/avatar — Remove profile avatar
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Delete all avatar files for this user
  const { data: existingFiles } = await auth.adminDb.storage
    .from('avatars')
    .list(auth.profile.id)

  if (existingFiles && existingFiles.length > 0) {
    const paths = existingFiles.map(f => `${auth.profile.id}/${f.name}`)
    await auth.adminDb.storage.from('avatars').remove(paths)
  }

  // Clear avatar URL in profile
  await auth.adminDb
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', auth.profile.id)

  return jsonResponse({ message: 'Avatar removed' })
}
