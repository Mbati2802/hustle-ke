import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

interface ChatBody {
  session_id?: string
  message?: string
}

// POST /api/ai/chat — store user message, generate response via FAQ intelligence, store bot message
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<ChatBody>(req)
  if (!body) return errorResponse('Invalid request body')

  const msg = (body.message || '').toString().trim()
  if (!msg) return errorResponse('Message is required', 400)

  const sessionId = body.session_id

  let session: any = null
  if (sessionId) {
    const { data } = await auth.adminDb
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', auth.profile.id)
      .single()
    session = data
  }

  if (!session) {
    const { data } = await auth.adminDb
      .from('ai_chat_sessions')
      .insert({ user_id: auth.profile.id, channel: 'live_chat' })
      .select('*')
      .single()
    session = data
  }

  const now = new Date().toISOString()

  await auth.adminDb.from('ai_chat_messages').insert({
    session_id: session.id,
    sender: 'user',
    content: msg.slice(0, 4000),
    created_at: now,
  })

  // Use the existing intelligence endpoint internally
  const baseUrl = new URL(req.url)
  const askUrl = new URL('/api/faq/intelligence', baseUrl)
  askUrl.searchParams.set('action', 'ask')
  askUrl.searchParams.set('q', msg)

  const res = await fetch(askUrl.toString(), { headers: { 'Content-Type': 'application/json' } })
  const data = await res.json().catch(() => ({}))

  const answer = (data.answer || 'Thanks! A human agent can help if this is urgent.') as string
  const meta = {
    source: data.source,
    confidence: data.confidence,
    relatedFaqs: data.relatedFaqs || [],
    category: data.category,
    matchedQuestion: data.matchedQuestion,
  }

  await auth.adminDb.from('ai_chat_messages').insert({
    session_id: session.id,
    sender: 'bot',
    content: answer.slice(0, 4000),
    meta,
    created_at: new Date().toISOString(),
  })

  await auth.adminDb.from('ai_chat_sessions').update({ updated_at: now }).eq('id', session.id)

  return jsonResponse({
    session_id: session.id,
    answer,
    meta,
  })
}
