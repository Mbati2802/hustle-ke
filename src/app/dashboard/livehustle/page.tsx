'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import {
  Zap,
  Clock,
  DollarSign,
  Star,
  Users,
  Play,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Radio,
  Timer,
  Send,
  ArrowLeft,
  Wifi,
  WifiOff,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

interface LiveSession {
  id: string
  title: string
  description?: string
  required_skills: string[]
  hourly_rate: number
  estimated_duration_minutes: number
  max_budget?: number
  status: string
  started_at?: string
  ended_at?: string
  actual_duration_minutes?: number
  total_billed?: number
  service_fee?: number
  net_payout?: number
  client_rating?: number
  freelancer_rating?: number
  client?: { id: string; full_name: string; avatar_url?: string; hustle_score?: number }
  freelancer?: { id: string; full_name: string; avatar_url?: string; title?: string }
  created_at: string
}

interface Availability {
  id: string
  is_available: boolean
  hourly_rate: number
  skills: string[]
  bio?: string
  max_session_hours: number
  total_sessions: number
  avg_rating: number
  total_earnings: number
}

interface SessionMessage {
  id: string
  sender_id: string
  content: string
  message_type: string
  file_url?: string
  file_name?: string
  created_at: string
}

type Tab = 'browse' | 'my-sessions' | 'availability' | 'create'

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-50', text: 'text-green-700', label: 'Open' },
  matched: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Matched' },
  in_progress: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'In Progress' },
  completed: { bg: 'bg-gray-50', text: 'text-gray-600', label: 'Completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
  paused: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Paused' },
}

export default function LiveHustlePage() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('browse')
  const [loading, setLoading] = useState(true)

  // Browse state
  const [availableFreelancers, setAvailableFreelancers] = useState<any[]>([])
  const [openSessions, setOpenSessions] = useState<LiveSession[]>([])

  // My sessions
  const [clientSessions, setClientSessions] = useState<LiveSession[]>([])
  const [freelancerSessions, setFreelancerSessions] = useState<LiveSession[]>([])

  // Availability
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [availForm, setAvailForm] = useState({
    is_available: false,
    hourly_rate: 500,
    skills: '' as string,
    bio: '',
    max_session_hours: 4,
  })
  const [savingAvail, setSavingAvail] = useState(false)

  // Create session
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    hourly_rate: 500,
    estimated_duration_minutes: 60,
  })
  const [creating, setCreating] = useState(false)

  // Active session view
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null)
  const [sessionMessages, setSessionMessages] = useState<SessionMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isClient = profile?.role === 'Client'

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, tab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'browse') {
        const [freelancers, sessions] = await Promise.all([
          fetch('/api/livehustle?action=browse').then(r => r.json()),
          fetch('/api/livehustle?action=open-sessions').then(r => r.json()),
        ])
        setAvailableFreelancers(freelancers.available || [])
        setOpenSessions(sessions.sessions || [])
      } else if (tab === 'my-sessions') {
        const data = await fetch('/api/livehustle?action=my-sessions').then(r => r.json())
        setClientSessions(data.asClient || [])
        setFreelancerSessions(data.asFreelancer || [])
      } else if (tab === 'availability') {
        const data = await fetch('/api/livehustle?action=my-availability').then(r => r.json())
        setAvailability(data.availability)
        if (data.availability) {
          setAvailForm({
            is_available: data.availability.is_available,
            hourly_rate: data.availability.hourly_rate,
            skills: (data.availability.skills || []).join(', '),
            bio: data.availability.bio || '',
            max_session_hours: data.availability.max_session_hours || 4,
          })
        }
      }
    } catch {}
    setLoading(false)
  }

  const createSession = async () => {
    setCreating(true)
    setMsg(null)
    try {
      const res = await fetch('/api/livehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-session',
          title: createForm.title,
          description: createForm.description || undefined,
          required_skills: createForm.required_skills.split(',').map(s => s.trim()).filter(Boolean),
          hourly_rate: createForm.hourly_rate,
          estimated_duration_minutes: createForm.estimated_duration_minutes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Session created! Freelancers will see your request.' })
        setCreateForm({ title: '', description: '', required_skills: '', hourly_rate: 500, estimated_duration_minutes: 60 })
        setTab('my-sessions')
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to create session' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setCreating(false)
  }

  const acceptSession = async (sessionId: string) => {
    setActionLoading(sessionId)
    try {
      const res = await fetch('/api/livehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', session_id: sessionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: 'Session accepted! You can now start working.' })
        loadData()
      } else {
        setMsg({ type: 'error', text: data.error || 'Failed to accept' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setActionLoading(null)
  }

  const sessionAction = async (sessionId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(sessionId)
    try {
      const res = await fetch('/api/livehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, session_id: sessionId, ...extra }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: data.message || 'Action completed' })
        loadData()
        if (activeSession?.id === sessionId) {
          loadSessionDetail(sessionId)
        }
      } else {
        setMsg({ type: 'error', text: data.error || 'Action failed' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error' })
    }
    setActionLoading(null)
  }

  const loadSessionDetail = async (sessionId: string) => {
    const data = await fetch(`/api/livehustle?action=session&session_id=${sessionId}`).then(r => r.json())
    setActiveSession(data.session)
    setSessionMessages(data.messages || [])
  }

  const sendMessage = async () => {
    if (!activeSession || !newMessage.trim()) return
    setSendingMsg(true)
    try {
      await fetch('/api/livehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', session_id: activeSession.id, content: newMessage }),
      })
      setNewMessage('')
      loadSessionDetail(activeSession.id)
    } catch {}
    setSendingMsg(false)
  }

  const saveAvailability = async () => {
    setSavingAvail(true)
    try {
      const res = await fetch('/api/livehustle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-availability',
          is_available: availForm.is_available,
          hourly_rate: availForm.hourly_rate,
          skills: availForm.skills.split(',').map(s => s.trim()).filter(Boolean),
          bio: availForm.bio || undefined,
          max_session_hours: availForm.max_session_hours,
        }),
      })
      if (res.ok) {
        setMsg({ type: 'success', text: availForm.is_available ? 'You are now available for LiveHustle!' : 'Availability updated.' })
        loadData()
      }
    } catch {}
    setSavingAvail(false)
  }

  // Session detail view
  if (activeSession) {
    const sc = statusColors[activeSession.status] || statusColors.open
    return (
      <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 max-w-3xl mx-auto">
        <button onClick={() => setActiveSession(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{activeSession.title}</h2>
              <p className="text-sm text-gray-500">{activeSession.description}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> KES {activeSession.hourly_rate}/hr</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeSession.estimated_duration_minutes} min</span>
            {activeSession.total_billed && (
              <span className="flex items-center gap-1 font-semibold text-green-600"><DollarSign className="w-3.5 h-3.5" /> Billed: KES {activeSession.total_billed.toLocaleString()}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {activeSession.status === 'matched' && (
              <button onClick={() => sessionAction(activeSession.id, 'start')}
                disabled={actionLoading === activeSession.id}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                {actionLoading === activeSession.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Start Session
              </button>
            )}
            {activeSession.status === 'in_progress' && (
              <button onClick={() => sessionAction(activeSession.id, 'end')}
                disabled={actionLoading === activeSession.id}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                {actionLoading === activeSession.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Timer className="w-3.5 h-3.5" />} End Session
              </button>
            )}
            {activeSession.status === 'completed' && !activeSession.client_rating && activeSession.client?.id === profile?.id && (
              <button onClick={() => sessionAction(activeSession.id, 'rate', { rating: 5, review: 'Great session!' })}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" /> Rate Session
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Session Chat</span>
          </div>
          <div className="h-[300px] overflow-y-auto p-4 space-y-3">
            {sessionMessages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
            ) : sessionMessages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.message_type === 'system' ? 'bg-gray-100 text-gray-500 text-center text-xs w-full' :
                  m.sender_id === profile?.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          {['matched', 'in_progress'].includes(activeSession.status) && (
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <button onClick={sendMessage} disabled={sendingMsg || !newMessage.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg">
                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-900 rounded-2xl p-6 lg:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">LiveHustle™</h1>
              <p className="text-purple-200 text-sm">Real-time work sessions with instant pay</p>
            </div>
          </div>
          <p className="text-purple-100/70 text-xs mt-3 max-w-lg">
            Need help RIGHT NOW? Post a session request and get matched with an available freelancer in minutes. Pay per minute, rate instantly.
          </p>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center justify-between ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="text-xs">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { key: 'browse' as Tab, label: 'Browse', icon: Users },
          { key: 'my-sessions' as Tab, label: 'My Sessions', icon: Radio },
          { key: 'availability' as Tab, label: 'Availability', icon: Wifi },
          { key: 'create' as Tab, label: 'New Session', icon: Plus },
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
      ) : (
        <>
          {/* Browse Tab */}
          {tab === 'browse' && (
            <div className="space-y-6">
              {/* Open Session Requests */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Live Session Requests
                </h2>
                {openSessions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No open sessions right now</p>
                    <p className="text-gray-400 text-xs mt-1">Check back soon or set your availability to get notified</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {openSessions.map((session) => (
                      <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{session.title}</h3>
                            {session.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{session.description}</p>}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {session.required_skills.map(s => (
                                <span key={s} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-semibold text-green-600"><DollarSign className="w-3.5 h-3.5" /> KES {session.hourly_rate}/hr</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{session.estimated_duration_minutes} min</span>
                              {session.client && <span>by {session.client.full_name}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => acceptSession(session.id)}
                            disabled={actionLoading === session.id}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0"
                          >
                            {actionLoading === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Freelancers */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-600" /> Available Freelancers
                </h2>
                {availableFreelancers.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <WifiOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No freelancers available right now</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {availableFreelancers.map((f: any) => (
                      <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          {f.profile?.avatar_url ? (
                            <img src={f.profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(f.profile?.full_name || '?')[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{f.profile?.full_name || 'Freelancer'}</p>
                            <p className="text-xs text-gray-500 truncate">{f.profile?.title || 'Available'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(f.skills || []).slice(0, 4).map((s: string) => (
                            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-semibold text-green-600">KES {f.hourly_rate}/hr</span>
                            {f.avg_rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400" /> {f.avg_rating}</span>}
                            {f.total_sessions > 0 && <span>{f.total_sessions} sessions</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Sessions Tab */}
          {tab === 'my-sessions' && (
            <div className="space-y-6">
              {[
                { title: 'Sessions as Client', sessions: clientSessions, emptyMsg: 'No sessions created yet' },
                { title: 'Sessions as Freelancer', sessions: freelancerSessions, emptyMsg: 'No sessions accepted yet' },
              ].map(({ title, sessions, emptyMsg }) => (
                <div key={title}>
                  <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
                  {sessions.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                      <p className="text-gray-400 text-sm">{emptyMsg}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => {
                        const sc = statusColors[session.status] || statusColors.open
                        return (
                          <button key={session.id} onClick={() => loadSessionDetail(session.id)}
                            className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">{session.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>KES {session.hourly_rate}/hr</span>
                                <span>{session.estimated_duration_minutes} min</span>
                                {session.total_billed && <span className="text-green-600 font-semibold">Billed: KES {session.total_billed.toLocaleString()}</span>}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Availability Tab */}
          {tab === 'availability' && (
            <div className="max-w-lg">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-green-600" /> Your LiveHustle Availability
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Available for LiveHustle</p>
                      <p className="text-xs text-gray-500">Clients can see you and request sessions</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" checked={availForm.is_available} onChange={(e) => setAvailForm(f => ({ ...f, is_available: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors" />
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (KES)</label>
                    <input type="number" value={availForm.hourly_rate} onChange={(e) => setAvailForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                    <input value={availForm.skills} onChange={(e) => setAvailForm(f => ({ ...f, skills: e.target.value }))}
                      placeholder="React, Node.js, Python..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                    <textarea value={availForm.bio} onChange={(e) => setAvailForm(f => ({ ...f, bio: e.target.value }))}
                      placeholder="What can you help with in a live session?"
                      rows={2}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Session Length (hours)</label>
                    <select value={availForm.max_session_hours} onChange={(e) => setAvailForm(f => ({ ...f, max_session_hours: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 outline-none">
                      {[1, 2, 3, 4, 6, 8].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>

                  <button onClick={saveAvailability} disabled={savingAvail}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    {savingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save Availability
                  </button>
                </div>

                {availability && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{availability.total_sessions}</p>
                      <p className="text-[10px] text-gray-500">Sessions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{availability.avg_rating || '—'}</p>
                      <p className="text-[10px] text-gray-500">Avg Rating</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">KES {(availability.total_earnings || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">Earned</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create Session Tab */}
          {tab === 'create' && (
            <div className="max-w-lg">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" /> Create LiveHustle Session
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What do you need help with? *</label>
                    <input value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Fix a React bug, Design a logo..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
                    <textarea value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what you need..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                    <input value={createForm.required_skills} onChange={(e) => setCreateForm(f => ({ ...f, required_skills: e.target.value }))}
                      placeholder="React, CSS, Node.js..."
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (KES) *</label>
                      <input type="number" value={createForm.hourly_rate} onChange={(e) => setCreateForm(f => ({ ...f, hourly_rate: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration (min) *</label>
                      <input type="number" value={createForm.estimated_duration_minutes} onChange={(e) => setCreateForm(f => ({ ...f, estimated_duration_minutes: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-purple-500 outline-none" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700">
                    <p className="font-semibold">Estimated cost: KES {Math.ceil((createForm.hourly_rate * createForm.estimated_duration_minutes) / 60).toLocaleString()}</p>
                    <p className="mt-0.5">You only pay for actual time used. Unused budget is returned.</p>
                  </div>

                  <button onClick={createSession} disabled={creating || !createForm.title || !createForm.hourly_rate}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Post Session Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
