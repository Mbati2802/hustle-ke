'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Ban, Shield, Trash2, User } from 'lucide-react'
import Link from 'next/link'

interface BlockedUser {
  id: string
  blocked_id: string
  reason: string | null
  created_at: string
  blocked: {
    id: string
    full_name: string
    avatar_url: string | null
    title: string | null
  }
}

export default function BlockedUsersPage() {
  const { user } = useAuth()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchBlockedUsers()
    }
  }, [user])

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/blocked-users')
      if (res.ok) {
        const data = await res.json()
        setBlockedUsers(data.blocked_users || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocked users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (blockId: string, userName: string) => {
    if (!confirm(`Unblock ${userName}? They will be able to contact you again.`)) return

    setUnblocking(blockId)
    try {
      const res = await fetch(`/api/blocked-users?block_id=${blockId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBlockedUsers(blockedUsers.filter(b => b.id !== blockId))
      } else {
        alert('Failed to unblock user')
      }
    } catch (error) {
      console.error('Failed to unblock user:', error)
      alert('Failed to unblock user')
    } finally {
      setUnblocking(null)
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Blocked Users</h1>
        <p className="text-gray-600">
          Users you've blocked won't be able to send you messages or proposals. You can unblock them at any time.
        </p>
      </div>

      <div className="space-y-4">
        {blockedUsers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No blocked users</p>
            <p className="text-sm text-gray-500">
              You haven't blocked anyone yet. You can block users from their profile page or messages.
            </p>
          </div>
        ) : (
          blockedUsers.map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {block.blocked.avatar_url ? (
                    <img
                      src={block.blocked.avatar_url}
                      alt={block.blocked.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <Link
                      href={`/talent/${block.blocked_id}`}
                      className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
                    >
                      {block.blocked.full_name}
                    </Link>
                    {block.blocked.title && (
                      <p className="text-sm text-gray-600 mt-1">{block.blocked.title}</p>
                    )}

                    {block.reason && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">Reason for blocking:</p>
                        <p className="text-sm text-gray-700">{block.reason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <Ban className="w-3 h-3" />
                      <span>Blocked on {new Date(block.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUnblock(block.id, block.blocked.full_name)}
                  disabled={unblocking === block.id}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-200"
                >
                  {unblocking === block.id ? (
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  Unblock
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">About Blocking</p>
            <ul className="text-blue-700 space-y-1 list-disc list-inside">
              <li>Blocked users cannot send you messages or proposals</li>
              <li>You won't see their content in search results</li>
              <li>Existing conversations will be hidden</li>
              <li>You can unblock users at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
