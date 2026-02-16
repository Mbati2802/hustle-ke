import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.msi', '.scr', '.com', '.vbs', '.ps1', '.sh']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.txt', '.doc', '.docx']

// POST /api/disputes/upload — upload dispute evidence file (stored in submissions bucket under disputes/)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return errorResponse('No file provided', 400)

  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (BLOCKED_EXTENSIONS.includes(ext)) return errorResponse(`File type ${ext} is blocked`, 400)
  if (!ALLOWED_EXTENSIONS.includes(ext)) return errorResponse(`File type ${ext} is not supported`, 400)
  if (file.size > MAX_FILE_SIZE) return errorResponse('File exceeds 20MB size limit', 400)

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `disputes/${auth.profile.id}/${timestamp}_${safeName}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, error } = await auth.adminDb.storage
    .from('submissions')
    .upload(storagePath, buffer, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (error) {
    console.error('[Dispute Evidence] upload error:', error)
    return errorResponse('Failed to upload evidence', 500)
  }

  const { data: urlData } = await auth.adminDb.storage
    .from('submissions')
    .createSignedUrl(data.path, 60 * 60 * 24 * 14)

  return jsonResponse({
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
      path: data.path,
      url: urlData?.signedUrl || null,
    },
  })
}
