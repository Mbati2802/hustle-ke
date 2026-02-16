'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// This component requests browser notification permission and polls for new notifications.
// When the user is away from the dashboard tab, it shows a browser popup notification.
export default function NotificationPermission() {
  const { user, profile } = useAuth()
  const lastCountRef = useRef(0)
  const hasRequestedRef = useRef(false)

  useEffect(() => {
    if (!user || !profile?.id) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    // Request permission once
    if (!hasRequestedRef.current && Notification.permission === 'default') {
      hasRequestedRef.current = true
      // Delay the request so it doesn't appear immediately on page load
      const timeout = setTimeout(() => {
        Notification.requestPermission()
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [user, profile])

  // Poll for notifications only when tab is hidden (to show browser push)
  // When tab is visible, NotificationDropdown handles polling — no duplicate calls
  useEffect(() => {
    if (!user || !profile?.id) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    let interval: NodeJS.Timeout | null = null

    const checkNotifications = async () => {
      if (!document.hidden) return // Only check when tab is hidden
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        const count = data.count || 0

        if (count > lastCountRef.current) {
          const diff = count - lastCountRef.current
          const latestNotif = data.notifications?.[0]

          const notification = new Notification('HustleKE', {
            body: latestNotif
              ? latestNotif.message
              : `You have ${diff} new notification${diff > 1 ? 's' : ''}`,
            icon: '/favicon.ico',
            tag: 'hustle-ke-notification',
          })

          notification.onclick = () => {
            window.focus()
            if (latestNotif?.link) {
              window.location.href = latestNotif.link
            }
            notification.close()
          }
        }

        lastCountRef.current = count
      } catch {}
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab went hidden — start polling every 30s for push notifications
        interval = setInterval(checkNotifications, 30000)
      } else {
        // Tab came back — stop polling (dropdown takes over)
        if (interval) { clearInterval(interval); interval = null }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (interval) clearInterval(interval)
    }
  }, [user, profile])

  return null // This is a side-effect-only component
}
