'use client'

import { useEffect, useState } from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SavedSearch {
  id: string
  name: string
  query?: string | null
  skills?: string[]
  county?: string | null
  remote_only?: boolean
  enterprise_only?: boolean
  min_budget?: number | null
  active: boolean
  created_at: string
}

export default function JobAlertsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [checkMsg, setCheckMsg] = useState('')
  const [checking, setChecking] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/saved-searches?limit=100')
      const data = await res.json()
      setItems(data.savedSearches || [])
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    load()
  }, [user])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create alert')
      } else {
        setName('')
        setQuery('')
        await load()
      }
    } catch {
      setError('Network error')
    }
    setCreating(false)
  }

  const remove = async (id: string) => {
    await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' })
    load()
  }

  const toggle = async (id: string, active: boolean) => {
    await fetch(`/api/saved-searches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    load()
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-500" /> Job Alerts
        </h1>
        <p className="text-sm text-gray-500 mt-1">Save job searches and get notified when matching jobs are posted.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            setChecking(true)
            setCheckMsg('')
            try {
              const res = await fetch('/api/job-alerts/check', { method: 'POST' })
              const data = await res.json()
              if (!res.ok) {
                setCheckMsg(data.error || 'Failed to check alerts')
              } else {
                const totalMatches = (data.results || []).reduce((sum: number, r: any) => sum + (r.matches || 0), 0)
                setCheckMsg(totalMatches > 0 ? `Found ${totalMatches} new matching job(s). Check notifications.` : 'No new matching jobs found.')
              }
            } catch {
              setCheckMsg('Network error')
            }
            setChecking(false)
          }}
          disabled={checking}
          className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-800 border border-amber-200 font-semibold text-sm"
        >
          {checking ? 'Checking…' : 'Check alerts now'}
        </button>
        {checkMsg && <span className="text-sm text-gray-600">{checkMsg}</span>}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={create} className="grid md:grid-cols-3 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alert name (e.g. React Remote)" className="px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Optional keyword (e.g. Next.js)" className="px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          <button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Alert'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No alerts yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((it) => (
              <div key={it.id} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{it.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{it.query ? `Keyword: ${it.query}` : 'No keyword'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(it.id, it.active)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${it.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {it.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => remove(it.id)} className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-700" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
