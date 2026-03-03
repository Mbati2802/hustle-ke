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

  // Detect greetings and gratitude before knowledge engine
  const lowerMsg = msg.toLowerCase().trim()
  const firstName = auth.profile.full_name?.split(' ')[0] || ''
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings']
  const gratitude = ['thanks', 'thank you', 'appreciate', 'grateful', 'thank u', 'thx', 'ty']
  const goodbyes = ['bye', 'goodbye', 'see you', 'later', 'cya']
  const words = lowerMsg.split(/\s+/)

  const isGreeting = greetings.some(g => lowerMsg.startsWith(g)) && words.length < 8
  const isGratitude = words.length < 10 && gratitude.some(g => lowerMsg.includes(g))
  const isGoodbye = goodbyes.some(g => lowerMsg.includes(g))

  let answer = ''
  let result: any = null

  if (isGreeting) {
    const hour = new Date().getHours()
    let timeGreet = 'Hello'
    if (hour < 12) timeGreet = 'Good morning'
    else if (hour < 17) timeGreet = 'Good afternoon'
    else timeGreet = 'Good evening'
    answer = `${timeGreet}, ${firstName || 'there'}! Thank you for reaching out. I'm your HustleKE AI Assistant — I'm here to help you with anything you need. How can I assist you today?`
  } else if (isGratitude) {
    const responses = [
      `You're very welcome, ${firstName || 'friend'}! It was my pleasure helping you. If you ever need anything else, I'm always here for you. Have a wonderful day! 😊`,
      `Happy to help, ${firstName || 'friend'}! That's exactly what I'm here for. Don't hesitate to come back anytime. Take care! 🙌`,
      `Glad I could help, ${firstName || 'friend'}! If anything else comes up, just pop back in and I'll be ready. Wishing you all the best! ✨`,
    ]
    answer = responses[Math.floor(Math.random() * responses.length)]
  } else if (isGoodbye) {
    answer = `Goodbye, ${firstName || 'friend'}! It was great chatting with you. Feel free to return anytime you need help. Have a wonderful day! 👋`
  } else {
    // Use the knowledge engine directly (no internal HTTP calls)
    result = queryKnowledge(msg, conversationContext)
    answer = result.answer

    // Make answer more conversational for high-confidence answers
    if (result.confidence === 'high' && !answer.includes('?') && !answer.endsWith('!')) {
      const followUps = [
        '\n\nIs there anything else you\'d like to know?',
        '\n\nDoes this help? Let me know if you need more details!',
        '\n\nHope that clarifies things! Feel free to ask more questions.',
      ]
      answer += followUps[Math.floor(Math.random() * followUps.length)]
    }

    // For low confidence, offer clear escalation options
    if (result.confidence === 'low') {
      if (!answer.includes('connect you')) {
        answer += `\n\nI'd love to help you further, ${firstName || 'friend'}. Would you like me to connect you with a human support agent? Just say **"Connect me to human"** and I'll set that up for you right away.`
      }
    }
  }

  const meta = result ? {
    source: result.source,
    confidence: result.confidence,
    relatedFaqs: result.relatedEntries.map((e: any) => ({
      id: e.id,
      question: e.question,
      answer: '',
      category: e.category,
    })),
    category: result.category,
    subcategory: result.subcategory,
    matchedQuestion: result.matchedQuestion,
    hasContext: conversationContext.length > 0,
    steps: result.steps,
    links: result.links,
  } : {
    source: 'system',
    confidence: 'high',
    relatedFaqs: [],
    category: 'conversation',
    hasContext: conversationContext.length > 0,
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
