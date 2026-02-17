'use client'

import { useState } from 'react'
import { Ban, Shield } from 'lucide-react'

interface BlockUserButtonProps {
  userId: string
  userName: string
  isBlocked?: boolean
  onBlockChange?: (blocked: boolean) => void
}

export default function BlockUserButton({ userId, userName, isBlocked = false, onBlockChange }: BlockUserButtonProps) {
  const [blocked, setBlocked] = useState(isBlocked)
  const [loading, setLoading] = useState(false)

  const handleBlock = async () => {
    if (blocked) {
      // Unblock
      if (!confirm(`Unblock ${userName}? They will be able to contact you again.`)) return

      setLoading(true)
      try {
        const res = await fetch(`/api/blocked-users?blocked_id=${userId}`, {
          method: 'DELETE',
        })

        if (res.ok) {
          setBlocked(false)
          onBlockChange?.(false)
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to unblock user')
        }
      } catch (error) {
        console.error('Failed to unblock user:', error)
        alert('Failed to unblock user')
      } finally {
        setLoading(false)
      }
    } else {
      // Block
      const reason = prompt(`Block ${userName}?\n\nOptional: Provide a reason for blocking this user:`)
      if (reason === null) return // User cancelled

      setLoading(true)
      try {
        const res = await fetch('/api/blocked-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocked_id: userId,
            reason: reason.trim() || undefined,
          }),
        })

        if (res.ok) {
          setBlocked(true)
          onBlockChange?.(true)
          alert(`${userName} has been blocked. You won't see their messages or proposals.`)
        } else {
          const data = await res.json()
          alert(data.error || 'Failed to block user')
        }
      } catch (error) {
        console.error('Failed to block user:', error)
        alert('Failed to block user')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
        blocked
          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={blocked ? 'Unblock this user' : 'Block this user'}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : blocked ? (
        <Shield className="w-4 h-4" />
      ) : (
        <Ban className="w-4 h-4" />
      )}
      {blocked ? 'Unblock' : 'Block User'}
    </button>
  )
}
