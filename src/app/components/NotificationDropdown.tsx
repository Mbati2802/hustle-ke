'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, MessageSquare, Briefcase, CheckCircle2, XCircle,
  FileCheck, RotateCcw, Crown, X, DollarSign, Shield,
  Info, Star, AlertTriangle, CheckCheck,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string
  read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; fallbackLink: string }> = {
  message:        { icon: MessageSquare, color: 'bg-green-100 text-green-600',    fallbackLink: '/dashboard/messages' },
  hire:           { icon: CheckCircle2,  color: 'bg-emerald-100 text-emerald-600', fallbackLink: '/dashboard/projects' },
  rejection:      { icon: XCircle,       color: 'bg-red-100 text-red-600',         fallbackLink: '/dashboard/proposals' },
  proposal:       { icon: Briefcase,     color: 'bg-blue-100 text-blue-600',       fallbackLink: '/dashboard/projects' },
  submission:     { icon: FileCheck,     color: 'bg-amber-100 text-amber-600',     fallbackLink: '/dashboard/projects' },
  revision:       { icon: RotateCcw,     color: 'bg-orange-100 text-orange-600',   fallbackLink: '/dashboard/messages' },
  subscription:   { icon: Crown,         color: 'bg-amber-100 text-amber-700',     fallbackLink: '/dashboard/settings?tab=subscription' },
  escrow:         { icon: DollarSign,    color: 'bg-green-100 text-green-700',     fallbackLink: '/dashboard/wallet' },
  security:       { icon: Shield,        color: 'bg-red-100 text-red-600',         fallbackLink: '/dashboard/settings?tab=security' },
  review_request: { icon: Star,          color: 'bg-purple-100 text-purple-600',   fallbackLink: '/dashboard/projects' },
  info:           { icon: Info,          color: 'bg-blue-100 text-blue-600',       fallbackLink: '/dashboard' },
  system:         { icon: AlertTriangle, color: 'bg-gray-100 text-gray-600',       fallbackLink: '/dashboard' },
}

export default function NotificationDropdown({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState(0)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        if (data.notifications) {
          setNotifications(data.notifications)
          setCount(data.count || 0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleNotifClick = useCallback(async (notif: Notification) => {
    setOpen(false)
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [notif.id] }),
        })
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
        setCount(prev => Math.max(0, prev - 1))
      } catch {}
    }
    const cfg = TYPE_CONFIG[notif.type]
    const href = notif.link || (cfg?.fallbackLink ?? '/dashboard/notifications')
    router.push(href)
  }, [router])

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll || count === 0) return
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setCount(0)
    } catch {}
    setMarkingAll(false)
  }, [markingAll, count])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const isMobile = variant === 'mobile'

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 relative transition-colors ${
          isMobile
            ? 'text-slate-400 hover:text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className={`absolute top-0.5 right-0.5 min-w-[17px] h-[17px] flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full px-0.5 ${
            isMobile ? 'ring-2 ring-slate-900' : 'ring-2 ring-white'
          }`}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`z-[100] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col ${
          isMobile ? 'fixed left-3 right-3 top-14' : 'absolute right-0 top-11 w-[380px]'
        }`} style={{ maxHeight: isMobile ? 'calc(100vh - 80px)' : '480px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              {count > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count} new</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">All caught up!</p>
                <p className="text-xs text-gray-300 mt-1">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                const Icon = cfg.icon
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 text-left ${
                      !notif.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${notif.read ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 shrink-0">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center justify-center gap-1"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
