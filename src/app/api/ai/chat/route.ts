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

  // Get conversation history (last 10 messages for context)
  const { data: history } = await auth.adminDb
    .from('ai_chat_messages')
    .select('sender, content')
    .eq('session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const conversationContext = (history || [])
    .reverse()
    .map(m => `${m.sender === 'user' ? 'User' : 'Bot'}: ${m.content}`)
    .join('\n')

  await auth.adminDb.from('ai_chat_messages').insert({
    session_id: session.id,
    sender: 'user',
    content: msg.slice(0, 4000),
    created_at: now,
  })

  // Build enhanced query with context
  let enhancedQuery = msg
  if (conversationContext) {
    enhancedQuery = `Context from conversation:\n${conversationContext}\n\nCurrent question: ${msg}`
  }

  // Use the existing intelligence endpoint internally
  const baseUrl = new URL(req.url)
  const askUrl = new URL('/api/faq/intelligence', baseUrl)
  askUrl.searchParams.set('action', 'ask')
  askUrl.searchParams.set('q', enhancedQuery)
  askUrl.searchParams.set('original_q', msg)

  const res = await fetch(askUrl.toString(), { headers: { 'Content-Type': 'application/json' } })
  const data = await res.json().catch(() => ({}))

  let answer = (data.answer || 'Thanks! A human agent can help if this is urgent.') as string
  
  // Make answer more conversational and contextual
  if (data.confidence === 'high' && !answer.includes('?')) {
    // Add helpful follow-up for high-confidence answers
    const followUps = [
      '\n\nIs there anything else you\'d like to know?',
      '\n\nDoes this help? Let me know if you need more details!',
      '\n\nHope that clarifies things! Feel free to ask more questions.',
    ]
    answer += followUps[Math.floor(Math.random() * followUps.length)]
  }

  const meta = {
    source: data.source,
    confidence: data.confidence,
    relatedFaqs: data.relatedFaqs || [],
    category: data.category,
    matchedQuestion: data.matchedQuestion,
    hasContext: !!conversationContext,
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
