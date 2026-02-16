'use client'

import { useState, useEffect } from 'react'
import {
  Settings, Save, CheckCircle2, XCircle, DollarSign,
  Globe, Bell, Shield, Sliders, Users
} from 'lucide-react'

interface Setting {
  id: string; key: string; value: string; description?: string; category: string
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  general: { label: 'General', icon: Globe, color: 'text-blue-500' },
  fees: { label: 'Fees & Pricing', icon: DollarSign, color: 'text-green-500' },
  wallet: { label: 'Wallet', icon: DollarSign, color: 'text-amber-500' },
  ui: { label: 'UI & Branding', icon: Sliders, color: 'text-purple-500' },
  limits: { label: 'Limits', icon: Shield, color: 'text-red-500' },
  social: { label: 'Social Links', icon: Users, color: 'text-indigo-500' },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState('general')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data.settings || [])
        const vals: Record<string, string> = {}
        for (const s of (data.settings || [])) {
          vals[s.key] = parseValue(s.value)
        }
        setEditedValues(vals)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function parseValue(raw: string): string {
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string') return parsed
      return String(parsed)
    } catch {
      return raw
    }
  }

  function getInputType(key: string, value: string): 'text' | 'number' | 'toggle' | 'url' {
    if (value === 'true' || value === 'false') return 'toggle'
    if (['service_fee_percent', 'tax_rate_percent', 'min_withdrawal', 'min_escrow', 'max_proposal_per_job', 'max_jobs_per_user'].includes(key)) return 'number'
    if (key.startsWith('social_')) return 'url'
    return 'text'
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    const changedSettings: Array<{ key: string; value: unknown }> = []

    for (const s of settings) {
      const original = parseValue(s.value)
      const current = editedValues[s.key]
      if (current !== original) {
        const inputType = getInputType(s.key, original)
        if (inputType === 'number') {
          changedSettings.push({ key: s.key, value: parseFloat(current) || 0 })
        } else if (inputType === 'toggle') {
          changedSettings.push({ key: s.key, value: current === 'true' })
        } else {
          changedSettings.push({ key: s.key, value: current })
        }
      }
    }

    if (changedSettings.length === 0) {
      setMessage({ type: 'error', text: 'No changes to save' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `${changedSettings.length} setting(s) updated` })
        // Refresh
        const refreshRes = await fetch('/api/admin/settings')
        const refreshData = await refreshRes.json()
        setSettings(refreshData.settings || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setSaving(false)
  }

  const categories = Object.keys(categoryConfig)
  const filteredSettings = settings.filter(s => s.category === activeCategory)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-xl border p-6 animate-pulse"><div className="h-48 bg-gray-100 rounded" /></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-gray-500" /> Site Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure platform behavior and appearance</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Category tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-2 lg:sticky lg:top-20">
            {categories.map(cat => {
              const conf = categoryConfig[cat]
              const Icon = conf.icon
              const count = settings.filter(s => s.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-1
                    ${activeCategory === cat ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Icon className={`w-4 h-4 ${activeCategory === cat ? 'text-green-600' : conf.color}`} />
                  <span className="flex-1 text-left">{conf.label}</span>
                  <span className="text-xs text-gray-400">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Settings form */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              {(() => { const c = categoryConfig[activeCategory]; const I = c.icon; return <I className={`w-5 h-5 ${c.color}`} /> })()}
              {categoryConfig[activeCategory]?.label || activeCategory}
            </h2>

            {filteredSettings.length === 0 ? (
              <p className="text-sm text-gray-400">No settings in this category</p>
            ) : (
              <div className="space-y-5">
                {filteredSettings.map(s => {
                  const inputType = getInputType(s.key, parseValue(s.value))
                  const currentVal = editedValues[s.key] || ''
                  const label = s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

                  return (
                    <div key={s.key} className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <div className="sm:w-48 shrink-0">
                        <label className="text-sm font-medium text-gray-700">{label}</label>
                        {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
                      </div>
                      <div className="flex-1">
                        {inputType === 'toggle' ? (
                          <button
                            onClick={() => setEditedValues(p => ({ ...p, [s.key]: currentVal === 'true' ? 'false' : 'true' }))}
                            className={`relative w-12 h-6 rounded-full transition ${currentVal === 'true' ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${currentVal === 'true' ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                        ) : inputType === 'number' ? (
                          <input type="number" value={currentVal}
                            onChange={e => setEditedValues(p => ({ ...p, [s.key]: e.target.value }))}
                            className="w-full max-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                        ) : inputType === 'url' ? (
                          <input type="url" value={currentVal}
                            onChange={e => setEditedValues(p => ({ ...p, [s.key]: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                        ) : (
                          <input type="text" value={currentVal}
                            onChange={e => setEditedValues(p => ({ ...p, [s.key]: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
