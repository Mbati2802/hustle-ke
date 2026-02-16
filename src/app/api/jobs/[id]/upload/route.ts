import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.msi', '.scr', '.com', '.vbs', '.ps1', '.sh']
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
  '.xls', '.xlsx', '.csv',
  '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.php',
  '.psd', '.ai', '.fig', '.sketch', '.xd',
]

// POST /api/jobs/[id]/upload — Upload a file for work submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  if (auth.profile.role !== 'Freelancer' && auth.profile.role !== 'Admin') {
    return errorResponse('Only freelancers can upload submission files', 403)
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return errorResponse('No file provided', 400)

  // Validate file extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return errorResponse(`File type ${ext} is blocked for security reasons`, 400)
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return errorResponse(`File type ${ext} is not supported`, 400)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse('File exceeds 50MB size limit', 400)
  }

  // Build storage path: submissions/{job_id}/{timestamp}_{filename}
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${params.id}/${timestamp}_${safeName}`

  // Upload to Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, error } = await auth.adminDb.storage
    .from('submissions')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    console.error('File upload error:', error)
    return errorResponse('Failed to upload file', 500)
  }

  // Get a signed URL for the file (valid for 7 days)
  const { data: urlData } = await auth.adminDb.storage
    .from('submissions')
    .createSignedUrl(data.path, 60 * 60 * 24 * 7)

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
