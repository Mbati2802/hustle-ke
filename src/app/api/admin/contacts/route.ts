import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/admin/contacts — List all contact messages
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)

  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = auth.supabase
    .from('contact_messages')
    .select('*', { count: 'exact' })

  if (status) {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,subject.ilike.%${search}%,message.ilike.%${search}%`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data: messages, error, count } = await query

  if (error) {
    console.error('[Admin Contacts] Fetch error:', error)
    return errorResponse('Failed to fetch contact messages', 500)
  }

  // Get statistics
  const { data: allMessages } = await auth.supabase
    .from('contact_messages')
    .select('status')

  const newCount = allMessages?.filter(m => m.status === 'new').length || 0
  const readCount = allMessages?.filter(m => m.status === 'read').length || 0
  const repliedCount = allMessages?.filter(m => m.status === 'replied').length || 0
  const spamCount = allMessages?.filter(m => m.status === 'spam').length || 0

  return jsonResponse({
    messages,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
    stats: {
      total: count || 0,
      new: newCount,
      read: readCount,
      replied: repliedCount,
      spam: spamCount
    }
  })
}
