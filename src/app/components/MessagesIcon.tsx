'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default function MessagesIcon({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const [unread, setUnread] = useState(0)

  const fetchUnread = useCallback(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(data => {
        const conversations: { unread_count?: number }[] = data.conversations || []
        const total = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
        setUnread(total)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  const isMobile = variant === 'mobile'

  return (
    <Link
      href="/dashboard/messages"
      className={`p-2 relative transition-colors ${
        isMobile
          ? 'text-slate-400 hover:text-white'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg'
      }`}
      aria-label="Messages"
    >
      <MessageSquare className="w-5 h-5" />
      {unread > 0 && (
        <span className={`absolute top-0.5 right-0.5 min-w-[17px] h-[17px] flex items-center justify-center text-[9px] font-bold text-white bg-green-500 rounded-full px-0.5 ${
          isMobile ? 'ring-2 ring-slate-900' : 'ring-2 ring-white'
        }`}>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
