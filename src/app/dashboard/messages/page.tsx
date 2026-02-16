'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import {
  MessageSquare,
  Search,
  Send,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Loader2,
  Reply,
  Star,
  Trash2,
  X,
  CornerUpRight,
} from 'lucide-react'

interface RawConversation {
  job_id: string
  content: string
  created_at: string
  is_read: boolean
  sender_id: string
  receiver_id: string
  unread_count?: number
  job?: { id: string; title: string; organization_id?: string; organization?: { id: string; name: string; logo_url?: string } | null }
  sender?: { id: string; full_name: string; avatar_url?: string }
  receiver?: { id: string; full_name: string; avatar_url?: string }
}

interface Conversation {
  job_id: string
  job_title: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_at: string
  unread_count: number
  is_org_job?: boolean
  org_name?: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_starred?: boolean
  reply_to_id?: string
  reply_to?: { id: string; content: string; sender?: { id: string; full_name: string } } | null
  sender?: { id: string; full_name: string; avatar_url?: string }
  receiver?: { id: string; full_name: string; avatar_url?: string }
  org_sender_name?: string
  organization_id?: string
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <MessagesContent />
    </Suspense>
  )
}

function MessagesContent() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const searchParams = useSearchParams()
  const urlJobId = searchParams.get('job_id')
  const urlTo = searchParams.get('to')
  const urlToName = searchParams.get('name')
  const urlJobTitle = searchParams.get('title')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
  const [otherTyping, setOtherTyping] = useState(false)
  const [orgMemberIds, setOrgMemberIds] = useState<string[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingSentRef = useRef<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const myProfileId = profile?.id

  // Transform raw API conversation data into our UI shape
  const transformConversations = useCallback((rawConvs: RawConversation[], memberIds: string[] = []): Conversation[] => {
    if (!myProfileId) return []
    const isOrgView = orgMode && activeOrg && memberIds.length > 0
    return rawConvs.map(conv => {
      let otherUserId: string
      let otherUserName = 'User'
      let otherUserAvatar: string | undefined

      if (isOrgView) {
        // In org mode: the "other party" is whoever is NOT an org member (i.e. the freelancer)
        const senderIsOrg = memberIds.includes(conv.sender_id)
        const receiverIsOrg = memberIds.includes(conv.receiver_id)
        if (senderIsOrg && !receiverIsOrg) {
          // Sender is org member, receiver is freelancer
          otherUserId = conv.receiver_id
          otherUserName = conv.receiver?.full_name || 'Freelancer'
          otherUserAvatar = conv.receiver?.avatar_url || undefined
        } else if (!senderIsOrg && receiverIsOrg) {
          // Sender is freelancer, receiver is org member
          otherUserId = conv.sender_id
          otherUserName = conv.sender?.full_name || 'Freelancer'
          otherUserAvatar = conv.sender?.avatar_url || undefined
        } else {
          // Fallback
          otherUserId = conv.sender_id === myProfileId ? conv.receiver_id : conv.sender_id
          if (conv.sender && conv.sender.id !== myProfileId) {
            otherUserName = conv.sender.full_name || 'User'
            otherUserAvatar = conv.sender.avatar_url || undefined
          } else if (conv.receiver && conv.receiver.id !== myProfileId) {
            otherUserName = conv.receiver.full_name || 'User'
            otherUserAvatar = conv.receiver.avatar_url || undefined
          }
        }
      } else {
        // Personal mode: other party is whoever is not me
        const isSender = conv.sender_id === myProfileId
        otherUserId = isSender ? conv.receiver_id : conv.sender_id
        if (conv.sender && conv.sender.id !== myProfileId) {
          otherUserName = conv.sender.full_name || 'User'
          otherUserAvatar = conv.sender.avatar_url || undefined
        } else if (conv.receiver && conv.receiver.id !== myProfileId) {
          otherUserName = conv.receiver.full_name || 'User'
          otherUserAvatar = conv.receiver.avatar_url || undefined
        }
        // If this is an org job conversation, show org name instead of individual name
        if (conv.job?.organization_id && conv.job?.organization?.name) {
          otherUserName = conv.job.organization.name
          otherUserAvatar = conv.job.organization.logo_url || undefined
        }
      }

      return {
        job_id: conv.job_id,
        job_title: conv.job?.title || 'Job',
        other_user_id: otherUserId,
        other_user_name: otherUserName,
        other_user_avatar: otherUserAvatar,
        last_message: conv.content || '',
        last_message_at: conv.created_at || '',
        unread_count: conv.unread_count || 0,
        is_org_job: !!conv.job?.organization_id,
        org_name: conv.job?.organization?.name || undefined,
      }
    })
  }, [myProfileId, orgMode, activeOrg])

  // EFFECT 1: Fetch conversations from API
  useEffect(() => {
    if (!user || !myProfileId) return

    const loadConversations = async () => {
      try {
        const query = orgMode && activeOrg ? `/api/messages?organization_id=${activeOrg.id}` : '/api/messages'
        console.log('[Messages] Fetching conversations from:', query)
        const res = await fetch(query, { cache: 'no-store' }) // Add no-cache to prevent stale data
        
        if (!res.ok) {
          throw new Error(`API returned status: ${res.status}`)
        }
        
        const data = await res.json()
        console.log('[Messages] API returned', data.conversations?.length || 0, 'conversations')
        const memberIds: string[] = data.org_member_ids || []
        if (memberIds.length > 0) setOrgMemberIds(memberIds)
        
        // Add debug logging to help diagnose conversation transformation issues
        if (data.conversations?.length) {
          console.log('[Messages] Sample conversation data:', data.conversations[0])
        }
        
        const transformed = data.conversations ? transformConversations(data.conversations, memberIds) : []
        console.log('[Messages] Transformed conversations:', transformed.length)
        setConversations(transformed)

        // Auto-select first conversation if no URL param
        if (!urlJobId && transformed.length > 0) {
          setActiveJobId(transformed[0].job_id)
        }
      } catch (e) {
        console.error('[Messages] Failed to fetch conversations:', e)
      }
      setLoading(false)
    }

    loadConversations()
  }, [user, myProfileId, transformConversations, urlJobId, orgMode, activeOrg])

  // EFFECT 2: Handle URL params — select existing or create temp conversation
  useEffect(() => {
    if (!urlJobId || !myProfileId || loading) return

    // If conversation already exists (from API or previously created), just select it
    const existing = conversations.find(c => c.job_id === urlJobId)
    if (existing) {
      if (activeJobId !== urlJobId) {
        setActiveJobId(urlJobId)
        setMobileShowChat(true)
      }
      return
    }

    // No existing conversation — create a temp one
    const createTempConversation = async () => {
      let receiverId = urlTo || ''
      let receiverName = urlToName ? decodeURIComponent(urlToName) : ''
      const jobTitle = urlJobTitle ? decodeURIComponent(urlJobTitle) : 'Job'

      // If receiver info not in URL params, fetch from API
      if (!receiverId) {
        console.log('[Messages] No receiver in URL, resolving from job API...')
        try {
          const jobRes = await fetch(`/api/jobs/${urlJobId}`)
          const jobData = await jobRes.json()
          const job = jobData.job
          if (job) {
            if (job.client_id === myProfileId) {
              const propRes = await fetch(`/api/jobs/${urlJobId}/proposals`)
              const propData = await propRes.json()
              const accepted = propData.proposals?.find((p: Record<string, string>) => p.status === 'Accepted')
              if (accepted) {
                receiverId = accepted.freelancer_id || ''
                const fl = accepted.freelancer as Record<string, string> | undefined
                receiverName = fl?.full_name || 'Freelancer'
              }
            } else {
              receiverId = job.client_id || ''
              receiverName = job.client?.full_name || 'Client'
            }
          }
        } catch (e) {
          console.error('[Messages] Failed to resolve receiver:', e)
        }
      }

      if (!receiverId) {
        console.warn('[Messages] Could not determine receiver for job', urlJobId)
        return
      }

      console.log('[Messages] Creating temp conversation:', receiverId, receiverName)
      const newConv: Conversation = {
        job_id: urlJobId,
        job_title: jobTitle,
        other_user_id: receiverId,
        other_user_name: receiverName || 'User',
        last_message: 'Start a conversation...',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      }
      setConversations(prev => [newConv, ...prev.filter(c => c.job_id !== urlJobId)])
      setActiveJobId(urlJobId)
      setMobileShowChat(true)
    }

    createTempConversation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlJobId, urlTo, urlToName, urlJobTitle, myProfileId, loading])

  // EFFECT 3: Fetch initial messages and setup realtime updates
  useEffect(() => {
    if (!activeJobId || !user) return
    let cancelled = false

    // Fetch initial messages
    const fetchInitialMessages = async () => {
      try {
        const query = orgMode && activeOrg ? `/api/messages?job_id=${activeJobId}&organization_id=${activeOrg.id}` : `/api/messages?job_id=${activeJobId}`
        console.log('[Messages] Fetching messages for job:', activeJobId)
        
        const r = await fetch(query, { cache: 'no-store' }) // Add no-cache to prevent stale data
        
        if (!r.ok) {
          throw new Error(`API returned status: ${r.status}`)
        }
        
        const data = await r.json()
        console.log('[Messages] Received messages count:', data.messages?.length || 0)
        
        if (!cancelled && data.messages) {
          setMessages(data.messages)
          // Log the first message to help debug
          if (data.messages.length > 0) {
            console.log('[Messages] First message sample:', {
              id: data.messages[0].id,
              sender_id: data.messages[0].sender_id,
              receiver_id: data.messages[0].receiver_id,
              content: data.messages[0].content?.substring(0, 20) + '...'
            })
          }
        }
      } catch (error) {
        console.error('[Messages] Error fetching messages:', error)
      }
    }

    fetchInitialMessages()
    return () => { cancelled = true }
  }, [activeJobId, user, orgMode, activeOrg])

  // EFFECT 4: Realtime message updates
  const realtimeMessages = useRealtimeMessages(activeJobId || '')
  
  // Merge realtime messages with existing messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      setMessages(prev => {
        const merged = [...prev]
        realtimeMessages.forEach(newMsg => {
          const existingIndex = merged.findIndex(m => m.id === newMsg.id)
          if (existingIndex >= 0) {
            merged[existingIndex] = newMsg
          } else {
            merged.push(newMsg)
          }
        })
        return merged.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }
  }, [realtimeMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeConv = conversations.find(c => c.job_id === activeJobId)

  // Send typing indicator (throttled to once per 2s)
  const sendTypingSignal = useCallback(() => {
    if (!activeJobId || !myProfileId) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now
    fetch('/api/messages/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: activeJobId }),
    }).catch(() => {})
  }, [activeJobId, myProfileId])

  // Poll for typing status from the other user
  useEffect(() => {
    if (!activeJobId || !myProfileId) return
    let cancelled = false
    const checkTyping = async () => {
      try {
        const res = await fetch(`/api/messages/typing?job_id=${activeJobId}`)
        const data = await res.json()
        if (!cancelled) {
          setOtherTyping(data.typing === true)
        }
      } catch { /* ignore */ }
    }
    const interval = setInterval(checkTyping, 4000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [activeJobId, myProfileId])

  const handleSend = async () => {
    if (!newMessage.trim() || !activeJobId || sending) return
    const receiverId = activeConv?.other_user_id
    if (!receiverId) {
      setSendError('Cannot determine recipient. Please try again.')
      setTimeout(() => setSendError(''), 5000)
      return
    }
    setSending(true)
    setSendError('')
    try {
      const payload: Record<string, unknown> = {
        job_id: activeJobId,
        receiver_id: receiverId,
        content: newMessage.trim(),
      }
      if (orgMode && activeOrg) payload.organization_id = activeOrg.id
      if (replyTo) payload.reply_to_id = replyTo.id

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.message) {
          // Attach reply_to_id so the local lookup works immediately
          const enriched = replyTo ? { ...data.message, reply_to_id: replyTo.id } : data.message
          setMessages(prev => [...prev, enriched])
        }
        setNewMessage('')
        setReplyTo(null)
        setConversations(prev => prev.map(c =>
          c.job_id === activeJobId ? { ...c, last_message: newMessage, last_message_at: new Date().toISOString() } : c
        ))
      } else {
        setSendError(data.error || 'Failed to send message')
        setTimeout(() => setSendError(''), 8000)
      }
    } catch {
      setSendError('Network error. Please try again.')
      setTimeout(() => setSendError(''), 5000)
    }
    setSending(false)
  }

  const handleStarMessage = async (msgId: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, action: 'star' }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_starred: data.starred } : m))
      }
    } catch { /* ignore */ }
  }

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: msgId, action: 'delete' }),
      })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId))
      }
    } catch { /* ignore */ }
  }

  const handleReply = (msg: Message) => {
    setReplyTo(msg)
    inputRef.current?.focus()
  }

  const selectConversation = (jobId: string) => {
    setActiveJobId(jobId)
    setMobileShowChat(true)
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
  }

  const isMine = (senderId: string) => {
    if (senderId === myProfileId) return true
    // In org mode, messages from any org member are "ours"
    if (orgMode && activeOrg && orgMemberIds.length > 0) {
      return orgMemberIds.includes(senderId)
    }
    return false
  }

  return (
    <div className="max-w-5xl mx-auto flex h-[calc(100vh-56px-64px)] lg:h-[calc(100vh-64px)]">
      {/* Conversations List */}
      <div className={`${mobileShowChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search conversations..." className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:border-green-500 border border-transparent" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-full" /></div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages will appear when you start a project</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.job_id}
                onClick={() => selectConversation(conv.job_id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${activeJobId === conv.job_id ? 'bg-green-50' : ''}`}
              >
                {conv.other_user_avatar ? (
                  <img src={conv.other_user_avatar} alt={conv.other_user_name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(conv.other_user_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">{conv.other_user_name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                      {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-0.5 truncate">{conv.job_title}</p>
                  <p className="text-xs text-gray-600 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="bg-green-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center mt-1 flex-shrink-0 font-semibold">{conv.unread_count}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-3">
              <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link href={`/talent/${activeConv.other_user_id}`} className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
                {activeConv.other_user_avatar ? (
                  <img src={activeConv.other_user_avatar} alt={activeConv.other_user_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {getInitials(activeConv.other_user_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{activeConv.other_user_name}</p>
                  <p className="text-xs text-gray-400 truncate">{activeConv.job_title}</p>
                </div>
              </Link>
              {orgMode && activeOrg && (
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg shrink-0">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-[10px] font-semibold text-purple-700">Messaging as {activeOrg.name}</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-1">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const mine = isMine(msg.sender_id)
                  const showActions = hoveredMsg === msg.id
                  // Look up replied message content from local messages array
                  const replyMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null
                  // Detect sender change for visual separation
                  const prevMsg = idx > 0 ? messages[idx - 1] : null
                  const senderChanged = prevMsg && prevMsg.sender_id !== msg.sender_id
                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`flex items-end gap-1 transition-all duration-300 ${mine ? 'justify-end' : 'justify-start'} ${senderChanged ? 'mt-3' : ''}`}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Action buttons — left side for own messages */}
                      {mine && (
                        <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                          <button onClick={() => handleReply(msg)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleStarMessage(msg.id)} className={`p-1 rounded ${msg.is_starred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'}`} title="Star"><Star className={`w-3.5 h-3.5 ${msg.is_starred ? 'fill-current' : ''}`} /></button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-400 hover:text-red-400 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`max-w-[80%] lg:max-w-md rounded-lg text-sm relative shadow-sm ${
                        mine
                          ? 'bg-green-100 text-gray-900 rounded-tr-none'
                          : 'bg-white text-gray-900 rounded-tl-none'
                      }`}>
                        {/* WhatsApp-style reply quote — clickable to scroll to original */}
                        {replyMsg && (
                          <button
                            onClick={() => {
                              const el = document.getElementById(`msg-${replyMsg.id}`)
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                el.classList.add('ring-2', 'ring-green-400', 'ring-offset-1')
                                setTimeout(() => el.classList.remove('ring-2', 'ring-green-400', 'ring-offset-1'), 1500)
                              }
                            }}
                            className={`mx-1 mt-1 rounded-md overflow-hidden text-left w-[calc(100%-8px)] cursor-pointer hover:brightness-95 transition ${mine ? 'bg-green-200/60' : 'bg-gray-100'}`}
                          >
                            <div className="flex">
                              <div className={`w-1 shrink-0 ${mine ? 'bg-green-600' : 'bg-green-500'}`} />
                              <div className="px-2.5 py-1.5 min-w-0">
                                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{replyMsg.content}</p>
                              </div>
                            </div>
                          </button>
                        )}

                        <div className="px-3 py-1.5">
                          {!mine && activeConv?.is_org_job && (
                            <p className="text-[11px] text-purple-600/40 mb-0.5">
                              {msg.org_sender_name || `${msg.sender?.full_name || 'Team member'} — ${activeConv.org_name || activeConv.other_user_name}`}
                            </p>
                          )}
                          {mine && orgMode && activeOrg && msg.sender_id !== myProfileId && msg.sender?.full_name && (
                            <p className="text-[11px] text-purple-600/40 mb-0.5">{msg.sender.full_name}</p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap">
                            {(() => {
                              const match = msg.content.match(/\[REVIEW_WORK:(\/[^\]]+)\]/)
                              if (match) {
                                const textBefore = msg.content.slice(0, match.index).trimEnd()
                                return (
                                  <>
                                    {textBefore}
                                    {textBefore && <br />}
                                    <Link href={match[1]} className="inline-block mt-2 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                                      Review Work Here →
                                    </Link>
                                  </>
                                )
                              }
                              return msg.content
                            })()}
                          </p>
                          <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5">
                            {msg.is_starred && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                            <span className="text-[10px] text-gray-400">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* WhatsApp-style tail */}
                        <div className={`absolute top-0 w-2 h-3 ${
                          mine
                            ? '-right-1.5 text-green-100'
                            : '-left-1.5 text-white'
                        }`}>
                          <svg viewBox="0 0 8 13" fill="currentColor" className="w-full h-full">
                            {mine
                              ? <path d="M0 0 L8 0 L0 8 Z" />
                              : <path d="M8 0 L0 0 L8 8 Z" />
                            }
                          </svg>
                        </div>
                      </div>

                      {/* Action buttons — right side for received messages */}
                      {!mine && (
                        <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
                          <button onClick={() => handleReply(msg)} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleStarMessage(msg.id)} className={`p-1 rounded ${msg.is_starred ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'}`} title="Star"><Star className={`w-3.5 h-3.5 ${msg.is_starred ? 'fill-current' : ''}`} /></button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 text-gray-400 hover:text-red-400 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Typing indicator — animated dots */}
              {otherTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg rounded-tl-none px-4 py-2.5 shadow-sm relative">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.6s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                    </div>
                    <div className="absolute top-0 -left-1.5 w-2 h-3 text-white">
                      <svg viewBox="0 0 8 13" fill="currentColor" className="w-full h-full">
                        <path d="M8 0 L0 0 L8 8 Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Platform Policy Notice */}
            <div className="bg-slate-50 border-t border-gray-100 px-4 py-1.5 flex items-center gap-2">
              <Shield className="w-3 h-3 text-slate-400 shrink-0" />
              <p className="text-[10px] text-slate-400">All communication must stay on HustleKE. Sharing contact info or external links is not allowed.</p>
            </div>

            {/* Send Error */}
            {sendError && (
              <div className="bg-red-50 border-t border-red-100 px-4 py-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{sendError}</p>
              </div>
            )}

            {/* Reply-to preview */}
            {replyTo && (
              <div className="bg-green-50 border-t border-green-100 px-4 py-2 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                    <Reply className="w-3 h-3" /> Replying to {replyTo.sender?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-3 lg:p-4 pb-20 lg:pb-4">
              <div className="flex items-center gap-2 lg:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); sendTypingSignal() }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={replyTo ? 'Type your reply...' : 'Type a message...'}
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:bg-white focus:border-green-500 border border-transparent text-sm"
                />
                <button onClick={handleSend} disabled={sending || !newMessage.trim()} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
