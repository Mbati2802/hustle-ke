'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  MessageSquare,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  Crown,
  X,
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

const typeIcons: Record<string, typeof MessageSquare> = {
  message: MessageSquare,
  hire: CheckCircle2,
  rejection: XCircle,
  proposal: Briefcase,
  submission: FileCheck,
  revision: RotateCcw,
  subscription: Crown,
}

const typeColors: Record<string, string> = {
  message: 'bg-green-100 text-green-600',
  hire: 'bg-emerald-100 text-emerald-600',
  rejection: 'bg-red-100 text-red-600',
  proposal: 'bg-blue-100 text-blue-600',
  submission: 'bg-amber-100 text-amber-600',
  revision: 'bg-orange-100 text-orange-600',
  subscription: 'bg-amber-100 text-amber-700',
}

export default function NotificationDropdown({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [count, setCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  useEffect(() => {
    const controller = new AbortController()

    const fetchNotifications = () => {
      fetch('/api/notifications', { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          if (data.notifications) {
            setNotifications(data.notifications)
            setCount(data.count || 0)
          }
        })
        .catch(() => {})
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
    return () => { clearInterval(interval); controller.abort() }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
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
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className={`absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1 ${
            isMobile ? 'ring-2 ring-slate-900' : 'ring-2 ring-white'
          }`}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-[100] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden ${
          isMobile ? 'right-0 top-12 w-[calc(100vw-32px)] max-w-sm' : 'right-0 top-12 w-96'
        }`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell
                const colorClass = typeColors[notif.type] || 'bg-gray-100 text-gray-600'
                return (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <Link
                href="/dashboard/messages"
                onClick={() => setOpen(false)}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                View all messages →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
