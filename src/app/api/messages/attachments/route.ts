import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'text/plain', 'text/csv',
]

// POST /api/messages/attachments — Upload file attachment for a message
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const messageId = formData.get('message_id') as string | null
  const jobId = formData.get('job_id') as string | null
  const receiverId = formData.get('receiver_id') as string | null

  if (!file) return errorResponse('No file provided', 400)
  if (file.size > MAX_FILE_SIZE) return errorResponse('File too large. Maximum 10MB.', 400)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse('File type not allowed. Allowed: images, PDF, Word, Excel, ZIP, text, CSV.', 400)
  }

  // If messageId provided, verify ownership
  if (messageId) {
    const { data: msg } = await auth.adminDb
      .from('messages')
      .select('id, sender_id')
      .eq('id', messageId)
      .eq('sender_id', auth.profile.id)
      .single()

    if (!msg) return errorResponse('Message not found or not yours', 404)
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${auth.profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await auth.adminDb.storage
    .from('attachments')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[Attachments] Upload error:', uploadError)
    return errorResponse('Failed to upload file', 500)
  }

  const { data: urlData } = auth.adminDb.storage
    .from('attachments')
    .getPublicUrl(storagePath)

  const fileUrl = urlData.publicUrl

  // If we have a messageId, create attachment record
  if (messageId) {
    await auth.adminDb.from('message_attachments').insert({
      message_id: messageId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      storage_path: storagePath,
      url: fileUrl,
    })
  }

  // If no messageId but we have job_id + receiver_id, create message with attachment
  if (!messageId && jobId && receiverId) {
    const { data: newMsg } = await auth.adminDb
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: auth.profile.id,
        receiver_id: receiverId,
        content: `📎 Sent a file: ${file.name}`,
      })
      .select('id')
      .single()

    if (newMsg) {
      await auth.adminDb.from('message_attachments').insert({
        message_id: newMsg.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        url: fileUrl,
      })
    }
  }

  return jsonResponse({
    url: fileUrl,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    storage_path: storagePath,
  })
}
