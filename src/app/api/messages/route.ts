import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody, getPagination } from '@/lib/api-utils'
import { validate, messageSchema } from '@/lib/validation'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { scanMessageContent } from '@/lib/content-filter'
import { notifyNewMessage } from '@/lib/notifications'

// GET /api/messages — List conversations (grouped by job)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')
  const orgId = url.searchParams.get('organization_id')

  if (jobId) {
    // Get messages for specific job
    const { limit, offset } = getPagination(req, 50)

    // Try with reply_to join; fall back to basic query if columns don't exist yet
    let messages: Record<string, unknown>[] | null = null
    let error: unknown = null
    let count: number | null = null

    // Check if user is an org member for this job (can see all messages)
    let isOrgParticipant = false
    const { data: msgJob } = await auth.adminDb.from('jobs').select('organization_id').eq('id', jobId).single()
    if (msgJob?.organization_id) {
      // Any org member can view conversations for org jobs (shared inbox)
      const { data: mem } = await auth.adminDb
        .from('organization_members').select('role')
        .eq('organization_id', msgJob.organization_id)
        .eq('user_id', auth.profile.id).single()
      if (mem) isOrgParticipant = true
    }

    let msgQuery = auth.adminDb
      .from('messages')
      .select('*, sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)', { count: 'exact' })
      .eq('job_id', jobId)

    // Org participants can see all messages for the job; personal users only their own
    if (!isOrgParticipant) {
      msgQuery = msgQuery.or(`sender_id.eq.${auth.profile.id},receiver_id.eq.${auth.profile.id}`)
    }

    const result = await msgQuery
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    messages = result.data
    error = result.error
    count = result.count

    // Filter out soft-deleted messages for the current user
    const filtered = (messages || []).filter((msg: Record<string, unknown>) => {
      if (msg.sender_id === auth.profile.id && msg.deleted_by_sender) return false
      if (msg.receiver_id === auth.profile.id && msg.deleted_by_receiver) return false
      return true
    })

    if (error) return errorResponse('Failed to fetch messages', 500)

    // Mark unread messages as read
    await auth.adminDb
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .eq('receiver_id', auth.profile.id)
      .eq('is_read', false)

    return jsonResponse({
      messages: filtered,
      pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    })
  }

  // List conversations: latest message per job
  let query = auth.adminDb
    .from('messages')
    .select('job_id, content, created_at, is_read, sender_id, receiver_id, job:jobs!job_id(id, title, organization_id, organization:organizations!organization_id(id, name, logo_url)), sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(100)

  // Filter by org mode or personal mode
  if (orgId) {
    const { data: orgJobs } = await auth.adminDb.from('jobs').select('id').eq('organization_id', orgId)
    const orgJobIds = (orgJobs || []).map((j: { id: string }) => j.id)
    if (orgJobIds.length === 0) {
      return jsonResponse({ conversations: [], org_member_ids: [] })
    }
    query = query.in('job_id', orgJobIds)
  } else {
    query = query.or(`sender_id.eq.${auth.profile.id},receiver_id.eq.${auth.profile.id}`)
  }

  const { data: conversations, error } = await query

  if (error) {
    console.error('Messages conversations query error:', error)
    return errorResponse('Failed to fetch conversations', 500)
  }
  console.log(`Messages API: found ${conversations?.length || 0} raw messages for user ${auth.profile.id}`)

  // Group by job_id, keep latest message
  const grouped = new Map<string, typeof conversations[0]>()
  if (conversations) {
    for (const msg of conversations) {
      if (!grouped.has(msg.job_id)) {
        grouped.set(msg.job_id, msg)
      }
    }
  }

  // Count unread per job
  const { data: unreadCounts } = await auth.adminDb
    .from('messages')
    .select('job_id')
    .eq('receiver_id', auth.profile.id)
    .eq('is_read', false)

  const unreadMap: Record<string, number> = {}
  if (unreadCounts) {
    for (const u of unreadCounts) {
      unreadMap[u.job_id] = (unreadMap[u.job_id] || 0) + 1
    }
  }

  const result: Array<Record<string, unknown>> = []
  grouped.forEach((msg) => {
    result.push({
      ...msg,
      unread_count: unreadMap[msg.job_id] || 0,
    })
  })

  // For org mode, return all org member user IDs so the UI knows which messages are "from the org"
  let orgMemberIds: string[] = []
  if (orgId) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId)
    orgMemberIds = (members || []).map((m: { user_id: string }) => m.user_id)
    // Also include the org owner
    const { data: org } = await auth.adminDb.from('organizations').select('owner_id').eq('id', orgId).single()
    if (org?.owner_id && !orgMemberIds.includes(org.owner_id)) orgMemberIds.push(org.owner_id)
  }

  return jsonResponse({ conversations: result, ...(orgId ? { org_member_ids: orgMemberIds } : {}) })
}

// POST /api/messages — Send a message
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Rate limit messages more strictly
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(`msg:${auth.profile.id}:${ip}`, RATE_LIMITS.message)
  if (!rl.allowed) return errorResponse('Message rate limit exceeded. Please slow down.', 429)

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{ job_id: string; receiver_id: string; content: string; organization_id?: string }>(body, messageSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  if (result.data.receiver_id === auth.profile.id) {
    return errorResponse('You cannot send messages to yourself', 400)
  }

  // Scan message content for contact sharing attempts
  const filterResult = scanMessageContent(result.data.content)
  if (filterResult.blocked) {
    return errorResponse(filterResult.reason, 400)
  }

  // Verify job exists and user is involved (either client or proposal freelancer)
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, organization_id')
    .eq('id', result.data.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  let isClient = job.client_id === auth.profile.id
  let isOrgMember = false
  let orgName = ''

  // Check org membership — any org member can message on org jobs (shared inbox)
  if (!isClient && job.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (membership) {
      isClient = true
      isOrgMember = true
    }
    if (isOrgMember) {
      const { data: org } = await auth.adminDb.from('organizations').select('name').eq('id', job.organization_id).single()
      orgName = org?.name || ''
    }
  }

  const { data: hasProposal } = await auth.adminDb
    .from('proposals')
    .select('id')
    .eq('job_id', result.data.job_id)
    .eq('freelancer_id', auth.profile.id)
    .single()

  if (!isClient && !hasProposal && auth.profile.role !== 'Admin') {
    return errorResponse('You must be involved in this job to send messages', 403)
  }

  const insertData: Record<string, unknown> = {
    job_id: result.data.job_id,
    sender_id: auth.profile.id,
    receiver_id: result.data.receiver_id,
    content: result.data.content,
  }
  if (result.data.organization_id) insertData.organization_id = result.data.organization_id
  else if (job.organization_id && isOrgMember) insertData.organization_id = job.organization_id
  if (body.reply_to_id) insertData.reply_to_id = body.reply_to_id
  // Add org sender name format: "PersonName - OrgName"
  if (isOrgMember && orgName) {
    insertData.org_sender_name = `${auth.profile.full_name} - ${orgName}`
  }

  let { data: message, error } = await auth.adminDb
    .from('messages')
    .insert(insertData)
    .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
    .single()

  // If org_sender_name or organization_id column doesn't exist yet, retry without those fields
  if (error && (insertData.org_sender_name || insertData.organization_id)) {
    console.warn('Messages POST: column not found, retrying without org fields')
    delete insertData.org_sender_name
    delete insertData.organization_id
    const retry = await auth.adminDb
      .from('messages')
      .insert(insertData)
      .select('*, sender:profiles!sender_id(id, full_name, avatar_url)')
      .single()
    message = retry.data
    error = retry.error
  }

  if (error) {
    console.error('Messages POST insert error:', error)
    return errorResponse('Failed to send message', 500)
  }
  console.log('Messages POST: sent message', message?.id, 'from', auth.profile.id, 'to', result.data.receiver_id)

  // Notify receiver of new message (site + email + SMS) — use org name for org messages
  const { data: msgJob } = await auth.adminDb.from('jobs').select('title').eq('id', result.data.job_id).single()
  const senderDisplayName = (isOrgMember && orgName) ? orgName : auth.profile.full_name
  notifyNewMessage(auth.adminDb, result.data.receiver_id, senderDisplayName, msgJob?.title || 'a job', result.data.job_id).catch(console.error)

  return jsonResponse({ message }, 201)
}

// PATCH /api/messages — Star or delete a message
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body || !body.message_id || !body.action) {
    return errorResponse('message_id and action are required', 400)
  }

  const { message_id, action } = body as { message_id: string; action: string }

  // Verify the message belongs to this user
  const { data: msg } = await auth.adminDb
    .from('messages')
    .select('id, sender_id, receiver_id, is_starred')
    .eq('id', message_id)
    .single()

  if (!msg) return errorResponse('Message not found', 404)
  if (msg.sender_id !== auth.profile.id && msg.receiver_id !== auth.profile.id) {
    return errorResponse('Not your message', 403)
  }

  if (action === 'star') {
    const { error } = await auth.adminDb
      .from('messages')
      .update({ is_starred: !msg.is_starred })
      .eq('id', message_id)
    if (error) return errorResponse('Failed to update message', 500)
    return jsonResponse({ starred: !msg.is_starred })
  }

  if (action === 'delete') {
    const updateField = msg.sender_id === auth.profile.id
      ? { deleted_by_sender: true }
      : { deleted_by_receiver: true }
    const { error } = await auth.adminDb
      .from('messages')
      .update(updateField)
      .eq('id', message_id)
    if (error) return errorResponse('Failed to delete message', 500)
    return jsonResponse({ deleted: true })
  }

  return errorResponse('Invalid action. Use "star" or "delete"', 400)
}
