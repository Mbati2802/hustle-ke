'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { generateShortTicketCode } from '@/lib/ticket-utils'
import { 
  MessageCircle, 
  X, 
  Send,
  User,
  Bot,
  Clock,
  Check,
  CheckCheck,
  Sparkles,
  UserRound,
  HelpCircle,
  ArrowRight,
  Star,
  CheckCircle2
} from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'human'
  timestamp: Date
  status?: 'sent' | 'delivered' | 'read'
  suggestions?: string[]
  meta?: {
    source?: string
    confidence?: string
    relatedFaqs?: Array<{ id: string; question: string; answer: string; category: string }>
    category?: string
    matchedQuestion?: string
  }
}

interface ConversationContext {
  topic: string | null
  urgency: 'low' | 'medium' | 'high'
  userType: 'freelancer' | 'client' | 'unknown'
  questionCount: number
  lastTopic: string | null
}

const knowledgeBase = {
  payments: {
    keywords: ['payment', 'mpesa', 'money', 'pay', 'withdraw', 'deposit', 'escrow', 'funds', 'transaction', 'ksh', 'kes'],
    responses: [
      'I can help with payment questions. Are you having issues with deposits, withdrawals, or escrow payments?',
      'Our M-Pesa integration allows instant payments. What specific payment issue are you experiencing?',
      'For payment disputes, please check your escrow status first. Is your payment stuck in escrow?'
    ],
    followUp: ['Is your payment stuck?', 'Need help with M-Pesa?', 'Having trouble with escrow?']
  },
  jobs: {
    keywords: ['job', 'work', 'hire', 'apply', 'proposal', 'project', 'gig', 'contract', 'freelance', 'client', 'employer', 'post', 'posting', 'listing', 'create job', 'new job', 'job listing', 'hiring', 'talent', 'worker'],
    responses: [
      'Looking for work or posting a job? I can guide you through either process.',
      'Are you trying to find work as a freelancer or hire talent for your project?',
      'I can help with job applications, posting jobs, or managing ongoing contracts. What do you need?'
    ],
    followUp: ['Looking for work?', 'Need to hire someone?', 'Want to post a job?', 'Job posting issue?']
  },
  account: {
    keywords: ['account', 'profile', 'login', 'password', 'signup', 'verify', 'verification', 'id', 'document', 'identity'],
    responses: [
      'Account issues? I can help with login problems, verification, or profile updates.',
      'Are you having trouble with account verification or login access?',
      'For account verification, you will need your ID and phone number ready. What specific issue are you facing?'
    ],
    followUp: ['Can\'t log in?', 'Need verification help?', 'Want to update profile?']
  },
  technical: {
    keywords: ['bug', 'error', 'broken', 'not working', 'issue', 'problem', 'crash', 'buggy', 'glitch', 'slow', 'loading', 'failed'],
    responses: [
      'Technical issues can be frustrating. Can you describe what is not working properly?',
      'Is this a website bug, app issue, or payment processing problem?',
      'I will try to troubleshoot with you. What exactly happens when you encounter this issue?'
    ],
    followUp: ['Is it a website bug?', 'Payment not working?', 'Profile issue?']
  },
  disputes: {
    keywords: ['dispute', 'scam', 'fraud', 'cheat', 'lie', 'argue', 'conflict', 'disagreement', 'resolution'],
    responses: [
      'Disputes are handled through our resolution center. Have you tried opening a dispute ticket?',
      'I can help you understand the dispute process. Is this about a payment or work quality issue?',
      'For serious disputes, we have a dedicated team. Can you briefly explain what happened?'
    ],
    followUp: ['Open dispute ticket?', 'Payment issue?', 'Work quality problem?']
  },
  fees: {
    keywords: ['fee', 'fees', 'commission', 'charge', 'charged', 'cost', 'price', 'pricing', 'expensive', 'cheap', 'subscription', 'how much', 'percentage', 'percent', 'tariff'],
    responses: [
      'Here is how HustleKE fees work:\n\n• **Free Plan**: 6% service fee on completed projects\n• **Pro Plan** (KES 999/mo): 4% service fee + priority features\n• **Enterprise**: Custom rates for teams\n\nNo hidden charges. No signup fees. You only pay when a project is completed successfully. M-Pesa withdrawal fees are standard Safaricom rates.\n\nWould you like more details on any plan?',
      'Quick fee breakdown:\n• Freelancers pay 6% (or 4% on Pro) from completed project earnings\n• Clients deposit the project budget + 6% service fee into escrow\n• No monthly fees on the Free plan\n• M-Pesa withdrawals use standard Safaricom charges\n\nCompared to competitors (10-20%), HustleKE is significantly cheaper!',
      'Our pricing is simple — 6% per completed project on the Free plan, 4% on Pro. No signup fees, no hidden charges. Check /pricing for the full comparison.'
    ],
    followUp: ['Freelancer fees?', 'Client costs?', 'Compare to others?', 'M-Pesa charges?']
  },
  safety: {
    keywords: ['safe', 'secure', 'trust', 'scam', 'fraud', 'protection', 'guarantee', 'insurance', 'risk'],
    responses: [
      'Safety is our priority. We use M-Pesa escrow to protect both freelancers and clients.',
      'Our verification system and Hustle Score help ensure trustworthy users.',
      'Are you concerned about payment safety or user trustworthiness?'
    ],
    followUp: ['Payment safety?', 'User verification?', 'Escrow protection?']
  },
  registration: {
    keywords: ['register', 'registration', 'sign up', 'signup', 'create account', 'join', 'new account', 'get started', 'enroll'],
    responses: [
      'I can help you with registration! Are you looking to sign up as a freelancer or a client?',
      'Creating an account is quick and easy. You will need your email, phone number, and ID for verification. What type of account do you want to create?',
      'Registration issues? Common problems include email verification not received or phone number already in use. What specific issue are you facing?'
    ],
    followUp: ['Freelancer signup?', 'Client signup?', 'Verification problem?']
  }
}

const smallTalk = {
  greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
  gratitude: ['thanks', 'thank you', 'appreciate', 'grateful', 'thank u', 'thx', 'ty'],
  goodbye: ['bye', 'goodbye', 'see you', 'later', 'cya'],
  help: ['help', 'support', 'assist', 'aid'],
  dismissal: ['none', 'no', 'not', 'nothing', 'nope', 'nah', 'all good', 'im good', 'all set', 'done', 'finished'],
  affirmative: ['yes', 'yeah', 'yup', 'sure', 'ok', 'okay', 'yep']
}

export default function LiveChatWidget() {
  const { user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I am HustleKE AI Assistant. I can help with payments, jobs, account issues, and more. What brings you here today?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['Payment issue', 'Find work', 'Hire talent', 'Account help', 'Registration help']
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [context, setContext] = useState<ConversationContext>({
    topic: null,
    urgency: 'low',
    userType: 'unknown',
    questionCount: 0,
    lastTopic: null
  })
  const [conversationStage, setConversationStage] = useState<'initial' | 'helped' | 'follow_up' | 'closing'>('initial')
  const [unansweredQuestions, setUnansweredQuestions] = useState<Array<{question: string; timestamp: Date}>>([])
  const [humanHandoff, setHumanHandoff] = useState(false)
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null)
  const [isConnectingHuman, setIsConnectingHuman] = useState(false)
  const [aiSessionId, setAiSessionId] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [showResolutionSurvey, setShowResolutionSurvey] = useState(false)
  const [satisfactionRating, setSatisfactionRating] = useState<'satisfied' | 'unsatisfied' | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeComment, setDisputeComment] = useState('')
  const [agentName, setAgentName] = useState<string | null>(null)
  const [waitingForAgent, setWaitingForAgent] = useState(false)
  const [agentIsTyping, setAgentIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('open-live-chat', handleOpenChat)
    return () => window.removeEventListener('open-live-chat', handleOpenChat)
  }, [])

  useEffect(() => {
    if (!supportTicketId || !user) return

    // Check ticket status for resolution
    const checkTicketStatus = async () => {
      try {
        const res = await fetch(`/api/support/tickets/${supportTicketId}/status`)
        if (res.ok) {
          const data = await res.json()
          if (data.ticket.status === 'Resolved' && !data.ticket.satisfaction_rating) {
            setShowResolutionSurvey(true)
          }
        }
      } catch {
        // Ignore errors
      }
    }

    const fetchSupportMessages = async () => {
      try {
        const res = await fetch(`/api/support/tickets/${supportTicketId}/messages?limit=200`)
        const data = await res.json()
        const supMsgs = (data.messages || []) as Array<{ id: string; sender_type: string; message: string; created_at: string; sender_name?: string }>

        // Check if admin has responded and extract agent name
        const adminMsg = supMsgs.find(m => m.sender_type === 'admin')
        if (adminMsg && adminMsg.sender_name) {
          setAgentName(adminMsg.sender_name)
          if (waitingForAgent) {
            setWaitingForAgent(false)
          }
        }

        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id))
          const mapped: Message[] = supMsgs
            .map((m) => ({
              id: `support-${m.id}`,
              text: m.message,
              sender: (m.sender_type === 'admin'
                ? 'human'
                : m.sender_type === 'user'
                  ? 'user'
                  : 'bot') as Message['sender'],
              timestamp: new Date(m.created_at),
            }))
            .filter((m) => !existing.has(m.id))

          if (mapped.length === 0) return prev
          return [...prev, ...mapped].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        })
      } catch {
        // ignore
      }
    }

    checkTicketStatus()
    fetchSupportMessages()
    const statusInterval = setInterval(checkTicketStatus, 5000)
    const msgInterval = setInterval(fetchSupportMessages, 2000)
    
    // Poll for typing status
    const checkTyping = async () => {
      try {
        const res = await fetch(`/api/support/typing?ticket_id=${supportTicketId}`)
        const data = await res.json()
        setAgentIsTyping(data.typing && data.typing.length > 0)
      } catch {
        // ignore
      }
    }
    const typingInterval = setInterval(checkTyping, 2000)
    
    return () => {
      clearInterval(statusInterval)
      clearInterval(msgInterval)
      clearInterval(typingInterval)
    }
  }, [supportTicketId, user])

  const analyzeIntent = useCallback((text: string): { topic: string | null; confidence: number; urgency: 'low' | 'medium' | 'high' } => {
    const lowerText = text.toLowerCase()
    let bestMatch = { topic: null as string | null, confidence: 0 }
    let urgency: 'low' | 'medium' | 'high' = 'low'

    const urgencyHigh = ['urgent', 'emergency', 'asap', 'immediately', 'stuck', 'cant', "can't", 'cannot', 'unable', 'not working']
    const urgencyMedium = ['soon', 'quick', 'fast', 'need', 'want']
    
    if (urgencyHigh.some(word => lowerText.includes(word))) urgency = 'high'
    else if (urgencyMedium.some(word => lowerText.includes(word))) urgency = 'medium'

    // Check for specific high-priority phrases first
    const specificPhrases: Record<string, string[]> = {
      fees: ['how much', 'fees charged', 'fee charged', 'what are the fees', 'service fee', 'commission rate', 'how much do you charge', 'what does it cost', 'pricing plan'],
      jobs: ['job posting', 'post a job', 'create job', 'hiring', 'trouble with my job', 'find work', 'find a job'],
      registration: ['registration issue', 'sign up problem', 'cannot register', 'how to register', 'how do i sign up', 'create account'],
      payments: ['payment failed', 'payment issue', 'money stuck', 'withdrawal problem', 'mpesa payment', 'withdraw money', 'deposit money'],
      account: ['login issue', 'cannot login', 'password problem', 'account locked', 'forgot password', 'reset password']
    }

    // Check specific phrases with higher confidence
    Object.entries(specificPhrases).forEach(([topic, phrases]) => {
      phrases.forEach(phrase => {
        if (lowerText.includes(phrase)) {
          bestMatch = { topic, confidence: 0.8 }
        }
      })
    })

    // Helper for whole-word keyword matching
    const keywordMatches = (text: string, keyword: string): boolean => {
      // Multi-word keywords use includes
      if (keyword.includes(' ')) return text.includes(keyword)
      // Single-word keywords use word boundary
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
      return regex.test(text)
    }

    // If no specific phrase matched, do keyword matching with word boundaries
    if (bestMatch.confidence === 0) {
      Object.entries(knowledgeBase).forEach(([topic, data]) => {
        let matches = 0
        data.keywords.forEach(keyword => {
          if (keywordMatches(lowerText, keyword)) matches++
        })
        const confidence = matches / Math.max(lowerText.split(' ').length, 1)
        if (confidence > bestMatch.confidence && matches > 0) {
          bestMatch = { topic, confidence }
        }
      })
    }

    return { topic: bestMatch.topic, confidence: bestMatch.confidence, urgency }
  }, [])

  // Helper: check if a word/phrase appears as a whole word in text (not as a substring of another word)
  const matchesWholeWord = useCallback((text: string, word: string): boolean => {
    // For multi-word phrases, use simple includes
    if (word.includes(' ')) return text.includes(word)
    // For single words, use word boundary regex
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
    return regex.test(text)
  }, [])

  const checkSmallTalk = useCallback((text: string, stage: typeof conversationStage): { response: string | null; newStage: typeof conversationStage } => {
    const lowerText = text.toLowerCase().trim()
    const words = lowerText.split(/\s+/)

    // Only treat as dismissal if it's a SHORT message that is clearly a dismissal
    // This prevents "I need to know..." from matching "no" inside "know"
    const isDismissal = (
      // Exact match (e.g. user just typed "no" or "nope")
      smallTalk.dismissal.some(d => lowerText === d) ||
      // Short message (< 6 words) with a whole-word dismissal match
      (words.length < 6 && smallTalk.dismissal.some(d => matchesWholeWord(lowerText, d)))
    )

    if (isDismissal) {
      const hour = new Date().getHours()
      let timeGreeting = ''
      if (hour < 12) timeGreeting = 'morning'
      else if (hour < 17) timeGreeting = 'afternoon'
      else if (hour < 21) timeGreeting = 'evening'
      else timeGreeting = 'night'
      
      return {
        response: `Thank you for chatting with me today! If you need any help in the future, I am always here. Have a lovely ${timeGreeting}! 🌟`,
        newStage: 'closing'
      }
    }
    
    // Check for affirmative responses when in follow-up stage (short messages only)
    if (stage === 'follow_up' && words.length < 5 && smallTalk.affirmative.some(a => matchesWholeWord(lowerText, a))) {
      return {
        response: 'Great! What else can I help you with?',
        newStage: 'helped'
      }
    }
    
    // Only match greetings for short messages or messages that START with a greeting
    const isGreeting = smallTalk.greetings.some(g => lowerText.startsWith(g)) && words.length < 8
    if (isGreeting) {
      return { response: 'Hi there! I am here to help with any HustleKE questions. What can I assist you with today?', newStage: 'initial' }
    }

    // Gratitude — only if the message is primarily a thank-you (short)
    if (words.length < 8 && smallTalk.gratitude.some(g => matchesWholeWord(lowerText, g))) {
      return { response: "You're welcome! I am happy to help. Is there anything else you need assistance with?", newStage: 'follow_up' }
    }

    // Goodbye
    if (smallTalk.goodbye.some(g => matchesWholeWord(lowerText, g))) {
      return { response: 'Goodbye! Feel free to return anytime you need help. Have a great day!', newStage: 'closing' }
    }

    // Generic "help" — only for very short messages like "help" or "I need help"
    if (words.length < 5 && smallTalk.help.some(h => matchesWholeWord(lowerText, h))) {
      return { response: "I am here to help! I can assist with:\n• Payments & M-Pesa\n• Finding work or hiring\n• Account & verification\n• Registration\n• Technical issues\n• Disputes\n\nWhat do you need help with?", newStage: 'initial' }
    }

    return { response: null, newStage: stage }
  }, [matchesWholeWord])

  const generateResponse = useCallback((userText: string, intent: { topic: string | null; confidence: number; urgency: string }, stage: typeof conversationStage): { text: string; newStage: typeof conversationStage } => {
    const smallTalkResult = checkSmallTalk(userText, stage)
    if (smallTalkResult.response) {
      return { text: smallTalkResult.response, newStage: smallTalkResult.newStage }
    }

    if (intent.confidence < 0.1 || !intent.topic) {
      const clarifyingQuestions = [
        'I want to make sure I help you correctly. Are you asking about payments, jobs, your account, registration, or something else?',
        "I didn't quite catch that. Could you tell me if this is about: 1) Payments, 2) Finding work, 3) Hiring talent, 4) Registration, or 5) Account issues?",
        'To help you best, could you share a bit more detail? Are you having trouble with payments, job applications, registration, or account access?'
      ]
      return { text: clarifyingQuestions[Math.floor(Math.random() * clarifyingQuestions.length)], newStage: 'helped' }
    }

    const topicData = knowledgeBase[intent.topic as keyof typeof knowledgeBase]
    if (!topicData) {
      return { text: "I am not sure I understand. Could you rephrase your question? Or would you like to speak with a human agent?", newStage: 'helped' }
    }

    const discussedBefore = conversationHistory.some(h => h === intent.topic)
    
    if (discussedBefore && context.questionCount > 2) {
      return { 
        text: `I see we have been discussing ${intent.topic}. I want to make sure you get the best help. Would you like me to:\n1) Connect you with a specialist\n2) Continue troubleshooting\n3) Check our detailed FAQ`,
        newStage: 'follow_up'
      }
    }

    const responseIndex = Math.min(context.questionCount, topicData.responses.length - 1)
    return { text: topicData.responses[responseIndex] || topicData.responses[0], newStage: 'helped' }
  }, [checkSmallTalk, context, conversationHistory])

  const getSuggestions = useCallback((intent: { topic: string | null }, stage: typeof conversationStage): string[] => {
    if (stage === 'closing') return []
    if (stage === 'follow_up') return ['No thanks', 'Yes, I need help with...', 'Connect to human']
    if (!intent.topic) return ['Payment issue', 'Find work', 'Hire talent', 'Account help', 'Registration help']
    
    const topicData = knowledgeBase[intent.topic as keyof typeof knowledgeBase]
    if (!topicData) return ['Tell me more', 'Need human help', 'View FAQ']
    
    return topicData.followUp || ['Tell me more', 'View details', 'Connect to agent']
  }, [])

  const classifyIssue = useCallback((userText: string, intent: { topic: string | null; confidence: number }): { category: string; subCategory: string; details: string } => {
    const lowerText = userText.toLowerCase()
    let category = intent.topic || 'general'
    let subCategory = 'general'
    let details = userText

    // Deep classification for registration
    if (category === 'registration' || lowerText.includes('register') || lowerText.includes('sign up')) {
      if (lowerText.includes('freelancer') || lowerText.includes('worker') || lowerText.includes('earn')) {
        subCategory = 'freelancer_registration'
      } else if (lowerText.includes('client') || lowerText.includes('hire') || lowerText.includes('employer')) {
        subCategory = 'client_registration'
      } else if (lowerText.includes('email') || lowerText.includes('verify') || lowerText.includes('confirmation')) {
        subCategory = 'email_verification'
      } else if (lowerText.includes('phone') || lowerText.includes('otp') || lowerText.includes('code')) {
        subCategory = 'phone_verification'
      } else if (lowerText.includes('id') || lowerText.includes('document') || lowerText.includes('identity')) {
        subCategory = 'identity_verification'
      } else if (lowerText.includes('stuck') || lowerText.includes('error') || lowerText.includes('failed')) {
        subCategory = 'registration_error'
      }
    }

    // Deep classification for payments
    if (category === 'payments') {
      if (lowerText.includes('deposit') || lowerText.includes('add money') || lowerText.includes('fund')) {
        subCategory = 'deposit'
      } else if (lowerText.includes('withdraw') || lowerText.includes('cash out') || lowerText.includes('send to mpesa')) {
        subCategory = 'withdrawal'
      } else if (lowerText.includes('escrow') || lowerText.includes('hold') || lowerText.includes('frozen')) {
        subCategory = 'escrow_issue'
      } else if (lowerText.includes('mpesa') || lowerText.includes('mobile money') || lowerText.includes('safaricom')) {
        subCategory = 'mpesa'
      } else if (lowerText.includes('failed') || lowerText.includes('declined') || lowerText.includes('rejected')) {
        subCategory = 'payment_failure'
      } else if (lowerText.includes('delay') || lowerText.includes('slow') || lowerText.includes('pending')) {
        subCategory = 'payment_delay'
      }
    }

    // Deep classification for jobs
    if (category === 'jobs' || lowerText.includes('job') || lowerText.includes('hiring') || lowerText.includes('posting')) {
      if (lowerText.includes('post') || lowerText.includes('create') || lowerText.includes('listing') || lowerText.includes('put up')) {
        subCategory = 'job_posting'
      } else if (lowerText.includes('apply') || lowerText.includes('application') || lowerText.includes('submit')) {
        subCategory = 'job_application'
      } else if (lowerText.includes('proposal') || lowerText.includes('bid') || lowerText.includes('quote')) {
        subCategory = 'proposal'
      } else if (lowerText.includes('contract') || lowerText.includes('agreement') || lowerText.includes('terms')) {
        subCategory = 'contract'
      } else if (lowerText.includes('milestone') || lowerText.includes('payment schedule')) {
        subCategory = 'milestone'
      } else if (lowerText.includes('trouble') || lowerText.includes('issue') || lowerText.includes('problem') || lowerText.includes('error')) {
        subCategory = 'job_issue'
      }
    }

    // Deep classification for account
    if (category === 'account') {
      if (lowerText.includes('login') || lowerText.includes('sign in') || lowerText.includes('access')) {
        subCategory = 'login_issue'
      } else if (lowerText.includes('password') || lowerText.includes('reset') || lowerText.includes('forgot')) {
        subCategory = 'password_reset'
      } else if (lowerText.includes('profile') || lowerText.includes('update') || lowerText.includes('edit')) {
        subCategory = 'profile_update'
      } else if (lowerText.includes('close') || lowerText.includes('delete') || lowerText.includes('deactivate')) {
        subCategory = 'account_closure'
      }
    }

    return { category, subCategory, details }
  }, [])

  const handleSend = async () => {
    if (!inputText.trim()) return

    const trimmedText = inputText.trim()

    // FIRST PRIORITY: Check for human handoff triggers BEFORE anything else
    const handoffTriggers = ['human', 'agent', 'person', 'real person', 'support team', 'operator', 'live agent', 'connect me to someone', 'talk to someone', 'speak to', 'connect to', 'connect me', 'talk to agent', 'speak with', 'real human']
    const wantsHuman = handoffTriggers.some(trigger => trimmedText.toLowerCase().includes(trigger))

    if (wantsHuman && user && !humanHandoff) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: trimmedText,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }
      setMessages((prev) => [...prev, userMessage])
      setInputText('')
      setIsTyping(true)
      setIsConnectingHuman(true)

      setTimeout(async () => {
        try {
          const intent = analyzeIntent(trimmedText)
          const issueClassification = classifyIssue(trimmedText, intent)

          const res = await fetch('/api/support/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'Live Chat Support Request',
              category: issueClassification.category,
              sub_category: issueClassification.subCategory,
              urgency: intent.urgency,
              message: trimmedText,
            }),
          })
          const data = await res.json()
          const ticketId = data.ticket?.id

          if (!res.ok || !ticketId) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              text: 'Sorry — I could not connect you to support right now. Please try again in a minute or use the Contact page.',
              sender: 'bot',
              timestamp: new Date(),
            }])
            setIsTyping(false)
            setIsConnectingHuman(false)
            return
          }

          setSupportTicketId(ticketId)
          setHumanHandoff(true)
          setWaitingForAgent(true)
          const shortCode = profile?.full_name ? generateShortTicketCode(ticketId, profile.full_name) : ticketId.substring(0, 8)
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: `✅ Connected to human support!\n\nTicket: ${shortCode}\n\nA support agent will respond shortly. You can continue chatting here.`,
            sender: 'human',
            timestamp: new Date(),
          }])
          
          // 20-second timeout for agent response
          setTimeout(() => {
            // Only show timeout message if agent hasn't responded yet
            setMessages(prev => {
              // Check if there's any actual agent message (not the connection message)
              const hasAgentReply = prev.some(m => m.sender === 'human' && !m.text.includes('Ticket:'))
              if (!hasAgentReply) {
                return [...prev, {
                  id: Date.now().toString(),
                  text: '⏰ All our agents are currently busy. Would you like to:',
                  sender: 'bot',
                  timestamp: new Date(),
                  suggestions: ['Wait for an agent', 'Continue with AI assistant']
                }]
              }
              return prev
            })
          }, 20000)
        } catch {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            text: 'Network error while connecting to support. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          }])
        } finally {
          setIsTyping(false)
          setIsConnectingHuman(false)
        }
      }, 600)
      return
    }

    if (wantsHuman && !user) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: trimmedText,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }
      setMessages((prev) => [...prev, userMessage])
      setInputText('')
      setIsTyping(true)

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'To connect with a human support agent, please log in or sign up first. This helps us provide personalized assistance and track your support history.',
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Log in', 'Sign up', 'Continue with AI'],
        }])
        setIsTyping(false)
      }, 700)
      return
    }

    // If we're already in human support mode, route messages to the support ticket
    if (humanHandoff && supportTicketId) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: trimmedText,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
      }

      setMessages((prev) => [...prev, userMessage])
      setInputText('')
      // Don't show typing indicator during human handoff

      try {
        const res = await fetch(`/api/support/tickets/${supportTicketId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmedText }),
        })
        if (res.ok) {
          // Message sent successfully, will be fetched via polling
        }
      } catch {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Network error while contacting support. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
        }])
      } finally {
        setIsTyping(false)
      }

      return
    }
    
    // Store unanswered questions for potential FAQ addition
    const intent = analyzeIntent(trimmedText)
    const issueClassification = classifyIssue(trimmedText, intent)
    
    // If confidence is low, store as potential new FAQ
    const lowerTrimmed = trimmedText.toLowerCase()
    const isSmallTalkMsg = smallTalk.greetings.some(g => lowerTrimmed.startsWith(g)) || 
        smallTalk.gratitude.some(g => matchesWholeWord(lowerTrimmed, g)) ||
        smallTalk.goodbye.some(g => matchesWholeWord(lowerTrimmed, g))
    if (intent.confidence < 0.15 && !isSmallTalkMsg) {
      setUnansweredQuestions(prev => [...prev, { question: trimmedText, timestamp: new Date() }])
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    setContext(prev => ({
      ...prev,
      questionCount: prev.questionCount + 1,
      lastTopic: prev.topic
    }))

    setConversationHistory(prev => [...prev, trimmedText.toLowerCase()])

    setContext(prev => ({
      ...prev,
      topic: intent.topic || prev.topic,
      urgency: intent.urgency
    }))

    // Check for thank you + specific topic
    const isThankYou = smallTalk.gratitude.some(g => trimmedText.toLowerCase().includes(g))
    if (isThankYou && conversationStage === 'helped') {
      setConversationStage('follow_up')
    }

    // If user is logged in, use AI chat API (memory + citations)
    if (user) {
      setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: aiSessionId, message: trimmedText }),
          })
          const data = await res.json()

          if (!res.ok) {
            // Fallback to local rules
            const responseResult = generateResponse(trimmedText, intent, conversationStage)
            const suggestions = getSuggestions(intent, responseResult.newStage)
            setConversationStage(responseResult.newStage)
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: responseResult.text,
              sender: 'bot',
              timestamp: new Date(),
              suggestions,
            }])
            setIsTyping(false)
            return
          }

          if (data.session_id && !aiSessionId) setAiSessionId(data.session_id)

          const responseText = (data.answer || 'I can help with that. Can you share more details?') as string
          const meta = (data.meta || {}) as Message['meta']
          const suggestions = meta?.relatedFaqs?.slice(0, 3).map((f) => f.question) || []

          setConversationStage('helped')
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: responseText,
            sender: 'bot',
            timestamp: new Date(),
            suggestions: suggestions.length > 0 ? suggestions : getSuggestions(intent, 'helped'),
            meta,
          }])
        } catch {
          const responseResult = generateResponse(trimmedText, intent, conversationStage)
          const suggestions = getSuggestions(intent, responseResult.newStage)
          setConversationStage(responseResult.newStage)
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: responseResult.text,
            sender: 'bot',
            timestamp: new Date(),
            suggestions,
          }])
        } finally {
          setIsTyping(false)
        }
      }, 700)
      return
    }

    // Anonymous fallback: local rules
    setTimeout(() => {
      const responseResult = generateResponse(trimmedText, intent, conversationStage)
      const suggestions = getSuggestions(intent, responseResult.newStage)

      setConversationStage(responseResult.newStage)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseResult.text,
        sender: 'bot',
        timestamp: new Date(),
        suggestions
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1200 + Math.random() * 800)
  }

  const handleSuggestionClick = (suggestion: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // PRIORITY: Check for human handoff triggers in suggestions
    const handoffTriggers = ['human', 'agent', 'person', 'real person', 'support team', 'operator', 'live agent', 'connect me to someone', 'talk to someone', 'speak to', 'connect to', 'connect me', 'talk to agent', 'speak with', 'real human']
    const wantsHuman = handoffTriggers.some(trigger => suggestion.toLowerCase().includes(trigger))

    if (wantsHuman && user && !humanHandoff) {
      setIsConnectingHuman(true)
      setTimeout(async () => {
        try {
          const intent = analyzeIntent(suggestion)
          const issueClassification = classifyIssue(suggestion, intent)

          const res = await fetch('/api/support/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: 'Live Chat Support Request',
              category: issueClassification.category,
              sub_category: issueClassification.subCategory,
              urgency: intent.urgency,
              message: suggestion,
            }),
          })
          const data = await res.json()
          const ticketId = data.ticket?.id

          if (!res.ok || !ticketId) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 2).toString(),
              text: 'Sorry — I could not connect you to support right now. Please try again in a minute or use the Contact page.',
              sender: 'bot',
              timestamp: new Date(),
            }])
            setIsTyping(false)
            setIsConnectingHuman(false)
            return
          }

          setSupportTicketId(ticketId)
          setHumanHandoff(true)
          setWaitingForAgent(true)
          const shortCode = profile?.full_name ? generateShortTicketCode(ticketId, profile.full_name) : ticketId.substring(0, 8)
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: `✅ Connected to human support!\n\nTicket: ${shortCode}\n\nA support agent will respond shortly. You can continue chatting here.`,
            sender: 'human',
            timestamp: new Date(),
          }])
          
          // 20-second timeout for agent response
          setTimeout(() => {
            // Only show timeout message if agent hasn't responded yet
            setMessages(prev => {
              // Check if there's any actual agent message (not the connection message)
              const hasAgentReply = prev.some(m => m.sender === 'human' && !m.text.includes('Ticket:'))
              if (!hasAgentReply) {
                return [...prev, {
                  id: Date.now().toString(),
                  text: '⏰ All our agents are currently busy. Would you like to:',
                  sender: 'bot',
                  timestamp: new Date(),
                  suggestions: ['Wait for an agent', 'Continue with AI assistant']
                }]
              }
              return prev
            })
          }, 20000)
        } catch {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            text: 'Network error while connecting to support. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          }])
        } finally {
          setIsTyping(false)
          setIsConnectingHuman(false)
        }
      }, 600)
      return
    }

    if (wantsHuman && !user) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'To connect with a human support agent, please log in or sign up first. This helps us provide personalized assistance and track your support history.',
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Log in', 'Sign up', 'Continue with AI'],
        }])
        setIsTyping(false)
      }, 700)
      return
    }

    const intent = analyzeIntent(suggestion)
    
    setTimeout(() => {
      let responseText = ''
      let newStage: typeof conversationStage = 'helped'
      
      switch (suggestion) {
        case 'Payment issue':
          responseText = 'I can help with payment issues. Are you experiencing problems with deposits, withdrawals, or escrow payments?'
          break
        case 'Find work':
          responseText = 'Great! To find work, you will need a complete profile. Have you set up your freelancer profile yet?'
          break
        case 'Hire talent':
          responseText = 'Perfect! Posting a job is easy. What type of talent are you looking to hire?'
          break
        case 'Account help':
          responseText = 'I can help with account issues. Are you having trouble logging in, verifying your account, or updating your profile?'
          break
        case 'Registration help':
          responseText = 'I can help with registration! Are you looking to sign up as a freelancer or a client?'
          break
        case 'No thanks':
        case 'No':
          const hour = new Date().getHours()
          let timeGreeting = ''
          if (hour < 12) timeGreeting = 'morning'
          else if (hour < 17) timeGreeting = 'afternoon'
          else if (hour < 21) timeGreeting = 'evening'
          else timeGreeting = 'night'
          responseText = `Thank you for chatting with me today! If you need any help in the future, I am always here. Have a lovely ${timeGreeting}! 🌟`
          newStage = 'closing'
          break
        default:
          const result = generateResponse(suggestion, intent, conversationStage)
          responseText = result.text
          newStage = result.newStage
      }

      setConversationStage(newStage)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: newStage === 'closing' ? [] : ['Tell me more', 'Need more help', 'Connect to human']
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-90' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 lg:bottom-24 right-3 sm:right-6 z-50 w-[420px] max-w-[calc(100vw-24px)] sm:max-w-[calc(100vw-48px)] h-[480px] sm:h-[580px] max-h-[calc(100vh-180px)] lg:max-h-[calc(100vh-140px)] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {humanHandoff ? (
                    <UserRound className="w-6 h-6 text-white" />
                  ) : (
                    <Bot className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-green-600"></div>
              </div>
              <div>
                <h3 className="text-white font-bold">
                  {humanHandoff ? (agentName || 'Human Support') : 'HustleKE AI'}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-green-100 text-sm">
                    {isConnectingHuman ? 'Connecting you to an agent…' : humanHandoff ? (agentName ? 'Online' : 'Connected to support') : 'AI Assistant'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1.5">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-green-600' 
                      : message.sender === 'human'
                      ? 'bg-blue-100'
                      : 'bg-green-100'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : message.sender === 'human' ? (
                      <UserRound className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className={`max-w-[75%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 ${
                      message.sender === 'user'
                        ? 'bg-green-600 text-white rounded-br-md'
                        : message.sender === 'human'
                        ? 'bg-blue-100 text-blue-900 rounded-bl-md'
                        : 'bg-white text-gray-800 shadow-sm rounded-bl-md border border-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    </div>
                    {message.sender === 'bot' && message.meta?.relatedFaqs && message.meta.relatedFaqs.length > 0 && (
                      <div className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                        <p className="text-[11px] font-semibold text-gray-600 mb-1">Sources</p>
                        <div className="space-y-1">
                          {message.meta.relatedFaqs.slice(0, 3).map((f) => (
                            <Link
                              key={f.id}
                              href="/faqs"
                              className="block text-[11px] text-green-700 hover:text-green-800 underline"
                            >
                              {f.question}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                      {message.sender === 'user' && message.status && (
                        <span className="text-gray-400">
                          {message.status === 'read' ? (
                            <CheckCheck className="w-3 h-3" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Suggestions */}
                {message.suggestions && !humanHandoff && (
                  <div className={`flex flex-wrap gap-2 mt-3 ${message.sender === 'user' ? 'justify-end pr-11' : 'pl-11'}`}>
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors shadow-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Resolution Satisfaction Survey - Inline */}
            {showResolutionSurvey && supportTicketId && (
              <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl mx-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Ticket Resolved</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">Were you satisfied with the support you received?</p>
                <div className="flex gap-2">
                  <button onClick={() => { setSatisfactionRating('satisfied'); setShowReviewForm(true); setShowResolutionSurvey(false) }} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">✓ Yes</button>
                  <button onClick={() => { setSatisfactionRating('unsatisfied'); setShowDisputeForm(true); setShowResolutionSurvey(false) }} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition">✗ No</button>
                </div>
              </div>
            )}

            {/* Review Form - Inline */}
            {showReviewForm && supportTicketId && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl mx-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Rate Your Experience</h4>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)}><Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} /></button>
                  ))}
                </div>
                {reviewRating > 0 && <p className="text-center text-xs text-gray-600 mb-2">{reviewRating === 5 ? '⭐ Excellent!' : reviewRating === 4 ? '⭐ Great!' : reviewRating === 3 ? '⭐ Good' : reviewRating === 2 ? '⭐ Fair' : '⭐ Poor'}</p>}
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Comments (optional)..." rows={2} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(''); setSatisfactionRating(null); setShowResolutionSurvey(false) }} className="flex-1 px-3 py-2 border rounded-lg text-sm">Skip</button>
                  <button onClick={async () => { if (reviewRating === 0) return; try { await fetch(`/api/support/tickets/${supportTicketId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ satisfaction_rating: 'satisfied', agent_review_rating: reviewRating, agent_review_comment: reviewComment }) }); setShowReviewForm(false); setShowResolutionSurvey(false); setReviewRating(0); setReviewComment(''); setSatisfactionRating(null); setMessages(prev => [...prev, { id: Date.now().toString(), text: '✅ Review submitted! Thank you for your feedback.', sender: 'bot', timestamp: new Date() }]) } catch { setMessages(prev => [...prev, { id: Date.now().toString(), text: '❌ Failed to submit review.', sender: 'bot', timestamp: new Date() }]) } }} disabled={reviewRating === 0} className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium">Submit</button>
                </div>
              </div>
            )}

            {/* Dispute Form - Inline */}
            {showDisputeForm && supportTicketId && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mx-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">We're Sorry</h4>
                <textarea value={disputeComment} onChange={(e) => setDisputeComment(e.target.value)} placeholder="Describe the issue..." rows={3} className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2"><p className="text-xs text-amber-800">📋 Chat evidence will be included</p></div>
                <div className="flex gap-2">
                  <button onClick={async () => { if (!disputeComment.trim()) return; try { await fetch(`/api/support/tickets/${supportTicketId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ satisfaction_rating: 'unsatisfied', satisfaction_comment: disputeComment }) }); setShowDisputeForm(false); setShowResolutionSurvey(false); setDisputeComment(''); setSatisfactionRating(null); setMessages(prev => [...prev, { id: Date.now().toString(), text: '✅ Feedback submitted.', sender: 'bot', timestamp: new Date() }]) } catch { } }} className="flex-1 px-3 py-2 border rounded-lg text-sm">Feedback Only</button>
                  <button onClick={async () => { if (!disputeComment.trim()) return; try { const msgRes = await fetch(`/api/support/tickets/${supportTicketId}/messages?limit=200`); const msgData = await msgRes.json(); const chatEvidence = (msgData.messages || []).map((m: any) => `[${m.sender_type}] ${new Date(m.created_at).toLocaleString()}: ${m.message}`).join('\n'); const disputeRes = await fetch('/api/support/disputes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: supportTicketId, title: `Support Ticket Dispute - ${supportTicketId}`, description: `${disputeComment}\n\n--- CHAT EVIDENCE ---\n${chatEvidence}`, chat_evidence: chatEvidence }) }); if (disputeRes.ok) { const disputeData = await disputeRes.json(); await fetch(`/api/support/tickets/${supportTicketId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ satisfaction_rating: 'unsatisfied', satisfaction_comment: disputeComment }) }); setShowDisputeForm(false); setShowResolutionSurvey(false); setDisputeComment(''); setSatisfactionRating(null); setMessages(prev => [...prev, { id: Date.now().toString(), text: `✅ Dispute lodged successfully! Dispute ID: ${disputeData.dispute?.id}. A supervisor will review your case within 24 hours.`, sender: 'bot', timestamp: new Date() }]) } else { const errorData = await disputeRes.json(); console.error('Dispute creation failed:', errorData); setMessages(prev => [...prev, { id: Date.now().toString(), text: `❌ Failed to create dispute: ${errorData.error || 'Unknown error'}`, sender: 'bot', timestamp: new Date() }]) } } catch (err) { console.error('Dispute error:', err); setMessages(prev => [...prev, { id: Date.now().toString(), text: '❌ Network error while creating dispute.', sender: 'bot', timestamp: new Date() }]) } }} className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Lodge Dispute</button>
                </div>
              </div>
            )}
            
            {/* Agent typing indicator for human chat */}
            {agentIsTyping && humanHandoff && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserRound className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Typing indicator - only show for AI, not human agents */}
            {isTyping && !humanHandoff && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-green-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

            {/* Unanswered Questions Tracker - Hidden from UI but tracks new FAQs */}
            {unansweredQuestions.length > 0 && process.env.NODE_ENV === 'development' && (
              <div className="hidden">
                Potential FAQs: {unansweredQuestions.length}
              </div>
            )}
          {humanHandoff && !showResolutionSurvey && !showReviewForm && !showDisputeForm && (
            <div className="bg-blue-50 border-t border-blue-100 px-4 py-2">
              <p className="text-xs text-blue-600 text-center">
                {agentName ? `You are chatting with ${agentName}` : 'You are now chatting with a human support agent'}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            {/* Quick actions */}
            {!humanHandoff && context.questionCount > 3 && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-400">Quick options:</span>
                <button
                  onClick={() => {
                    setInputText('Connect me to a human agent')
                    setTimeout(handleSend, 100)
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors"
                >
                  Talk to human
                </button>
                <Link
                  href="/faqs"
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  View FAQ
                </Link>
              </div>
            )}
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value)
                  // Send typing status for human chat
                  if (humanHandoff && supportTicketId) {
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                    fetch('/api/support/typing', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ticket_id: supportTicketId, is_typing: true })
                    }).catch(() => {})
                    typingTimeoutRef.current = setTimeout(() => {
                      fetch('/api/support/typing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticket_id: supportTicketId, is_typing: false })
                      }).catch(() => {})
                    }, 3000)
                  }
                }}
                placeholder={humanHandoff ? "Type your message..." : "Ask about payments, jobs, account..."}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-green-500 text-sm"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-11 h-11 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI-powered by HustleKE
              <span className="mx-1">•</span>
              <Link href="/faqs" className="text-green-600 hover:underline inline-flex items-center gap-0.5">
                FAQ
                <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
