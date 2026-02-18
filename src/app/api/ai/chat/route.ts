import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { queryKnowledge } from '@/lib/ai-knowledge-engine'

interface ChatBody {
  session_id?: string
  message?: string
}

// POST /api/ai/chat — store user message, generate response via AI knowledge engine, store bot message
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
    .map(m => m.content as string)

  await auth.adminDb.from('ai_chat_messages').insert({
    session_id: session.id,
    sender: 'user',
    content: msg.slice(0, 4000),
    created_at: now,
  })

  // Use the knowledge engine directly (no internal HTTP calls)
  const result = queryKnowledge(msg, conversationContext)

  let answer = result.answer

  // Make answer more conversational for high-confidence answers
  if (result.confidence === 'high' && !answer.includes('?') && !answer.endsWith('!')) {
    const followUps = [
      '\n\nIs there anything else you\'d like to know?',
      '\n\nDoes this help? Let me know if you need more details!',
      '\n\nHope that clarifies things! Feel free to ask more questions.',
    ]
    answer += followUps[Math.floor(Math.random() * followUps.length)]
  }

  // For low confidence, encourage rephrasing or human handoff
  if (result.confidence === 'low') {
    if (!answer.includes('Connect to human')) {
      answer += '\n\nIf this doesn\'t answer your question, try rephrasing it or click **"Connect to human"** for live support.'
    }
  }

  const meta = {
    source: result.source,
    confidence: result.confidence,
    relatedFaqs: result.relatedEntries.map(e => ({
      id: e.id,
      question: e.question,
      answer: '', // Don't send full answers in meta
      category: e.category,
    })),
    category: result.category,
    subcategory: result.subcategory,
    matchedQuestion: result.matchedQuestion,
    hasContext: conversationContext.length > 0,
    steps: result.steps,
    links: result.links,
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
