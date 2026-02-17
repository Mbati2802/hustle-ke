'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, Trash2, LogOut } from 'lucide-react'

interface Session {
  id: string
  device_info: {
    browser?: string
    browserVersion?: string
    os?: string
    osVersion?: string
    device?: string
    deviceType?: string
  }
  ip_address?: string
  location?: string
  is_current: boolean
  last_active: string
  created_at: string
  expires_at: string
}

export default function SessionsPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchSessions()
    }
  }, [user])

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const res = await fetch(`/api/sessions?session_id=${sessionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId))
      } else {
        alert('Failed to revoke session')
      }
    } catch (error) {
      console.error('Failed to revoke session:', error)
      alert('Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  const revokeAllOtherSessions = async () => {
    if (!confirm('Are you sure you want to log out all other devices? You will remain logged in on this device.')) {
      return
    }

    setRevoking('all')
    try {
      const currentSession = sessions.find(s => s.is_current)
      const res = await fetch(`/api/sessions?revoke_all=true&except_session_id=${currentSession?.id || ''}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        fetchSessions()
      } else {
        alert('Failed to revoke sessions')
      }
    } catch (error) {
      console.error('Failed to revoke sessions:', error)
      alert('Failed to revoke sessions')
    } finally {
      setRevoking(null)
    }
  }

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />
      case 'tablet':
        return <Tablet className="w-5 h-5" />
      default:
        return <Monitor className="w-5 h-5" />
    }
  }

  const formatLastActive = (lastActive: string) => {
    const now = new Date()
    const active = new Date(lastActive)
    const diffMs = now.getTime() - active.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return active.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Sessions</h1>
        <p className="text-gray-600">
          Manage your active sessions across different devices. You can log out from specific devices or all devices at once.
        </p>
      </div>

      {sessions.length > 1 && (
        <div className="mb-6">
          <button
            onClick={revokeAllOtherSessions}
            disabled={revoking === 'all'}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {revoking === 'all' ? 'Logging out...' : 'Log Out All Other Devices'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`bg-white rounded-lg border ${
                session.is_current ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
              } p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    {getDeviceIcon(session.device_info.deviceType)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {session.device_info.browser || 'Unknown Browser'}{' '}
                        {session.device_info.browserVersion && `v${session.device_info.browserVersion}`}
                      </h3>
                      {session.is_current && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Current Device
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>
                          {session.device_info.os || 'Unknown OS'}{' '}
                          {session.device_info.osVersion && `${session.device_info.osVersion}`}
                        </span>
                      </div>

                      {session.ip_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{session.ip_address}</span>
                          {session.location && <span className="text-gray-400">• {session.location}</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last active: {formatLastActive(session.last_active)}</span>
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Created: {new Date(session.created_at).toLocaleString()} •{' '}
                        Expires: {new Date(session.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {!session.is_current && (
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Revoke this session"
                  >
                    {revoking === session.id ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Security Tip</p>
            <p className="text-blue-700">
              If you see any sessions you don't recognize, revoke them immediately and change your password.
              Sessions expire automatically after 30 days of inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
