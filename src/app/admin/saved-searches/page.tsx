'use client'

import { useEffect, useState } from 'react'
import { Bell, Search, TrendingUp, Users, Clock } from 'lucide-react'

interface SavedSearchStat {
  total: number
  active: number
  inactive: number
  top_queries: Array<{ query: string; count: number }>
  recent: Array<{
    id: string
    name: string
    query: string | null
    user: { full_name: string; email: string }
    active: boolean
    created_at: string
    last_checked_at: string | null
  }>
}

export default function AdminSavedSearchesPage() {
  const [stats, setStats] = useState<SavedSearchStat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/saved-searches')
      const data = await res.json()
      setStats(data)
    } catch {
      setStats(null)
    }
    setLoading(false)
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-500" /> Saved Searches & Job Alerts
        </h1>
        <p className="text-sm text-gray-500 mt-1">Monitor user saved searches and job alert activity</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading stats...</div>
      ) : !stats ? (
        <div className="text-sm text-red-600">Failed to load stats</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Saved Searches</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.active}</p>
                  <p className="text-xs text-gray-500">Active Alerts</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                  <p className="text-xs text-gray-500">Paused Alerts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top queries */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-900">Top Search Queries</h2>
            </div>
            {stats.top_queries.length === 0 ? (
              <p className="text-sm text-gray-500">No queries yet</p>
            ) : (
              <div className="space-y-2">
                {stats.top_queries.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{q.query || '(No keyword)'}</span>
                    <span className="text-xs font-semibold text-gray-500">{q.count} searches</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent searches */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h2 className="font-bold text-gray-900">Recent Saved Searches</h2>
            </div>
            {stats.recent.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No saved searches yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recent.map((s) => (
                  <div key={s.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {s.query ? `Keyword: ${s.query}` : 'No keyword'} • By {s.user.full_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(s.created_at).toLocaleDateString()} • 
                          {s.last_checked_at ? ` Last checked ${new Date(s.last_checked_at).toLocaleDateString()}` : ' Never checked'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${s.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
