'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag, Search, Plus, X, CheckCircle2, XCircle, Loader2,
  Edit2, Trash2, Eye, Calendar, Percent, DollarSign,
  Copy, ToggleLeft, ToggleRight, TrendingUp, Users, Zap,
  AlertCircle, BarChart2, ChevronDown, Filter
} from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  description?: string
  discount_percent?: number
  discount_amount?: number
  max_uses?: number
  current_uses: number
  expires_at?: string
  is_active: boolean
  created_at: string
  usage_count: number
  total_discount: number
}

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'amount',
    discount_value: '',
    max_uses: '',
    expires_at: '',
    is_active: true
  })

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promo-codes')
      const data = await res.json()
      setPromoCodes(data.promo_codes || [])
    } catch (err) {
      console.error('Failed to fetch promo codes:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPromoCodes() }, [fetchPromoCodes])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          description: formData.description,
          discount_percent: formData.discount_type === 'percent' ? parseFloat(formData.discount_value) : null,
          discount_amount: formData.discount_type === 'amount' ? parseFloat(formData.discount_value) : null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Promo code created successfully' })
        setShowCreateModal(false)
        setFormData({ code: '', description: '', discount_type: 'percent', discount_value: '', max_uses: '', expires_at: '', is_active: true })
        fetchPromoCodes()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create promo code' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }

    setSaving(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPromo) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/promo-codes/${editingPromo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          discount_percent: formData.discount_type === 'percent' ? parseFloat(formData.discount_value) : null,
          discount_amount: formData.discount_type === 'amount' ? parseFloat(formData.discount_value) : null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: formData.expires_at || null,
          is_active: formData.is_active
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Promo code updated successfully' })
        setShowEditModal(false)
        setEditingPromo(null)
        fetchPromoCodes()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update promo code' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }

    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return

    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Promo code deleted successfully' })
        fetchPromoCodes()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete promo code' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
  }

  const openEditModal = (promo: PromoCode) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_percent ? 'percent' : 'amount',
      discount_value: String(promo.discount_percent || promo.discount_amount || ''),
      max_uses: String(promo.max_uses || ''),
      expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().split('T')[0] : '',
      is_active: promo.is_active
    })
    setShowEditModal(true)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const toggleActive = async (promo: PromoCode) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !promo.is_active })
      })
      if (res.ok) fetchPromoCodes()
    } catch { /* ignore */ }
  }

  const now = new Date()
  const filtered = promoCodes.filter(p => {
    const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (filterStatus === 'active') return p.is_active && (!p.expires_at || new Date(p.expires_at) > now)
    if (filterStatus === 'inactive') return !p.is_active
    if (filterStatus === 'expired') return p.expires_at && new Date(p.expires_at) <= now
    return true
  })

  const totalDiscount = promoCodes.reduce((s, p) => s + (p.total_discount || 0), 0)
  const totalUses = promoCodes.reduce((s, p) => s + (p.usage_count || 0), 0)
  const activeCount = promoCodes.filter(p => p.is_active).length

  const isExpired = (promo: PromoCode) => promo.expires_at && new Date(promo.expires_at) <= now

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-purple-500" /> Promo Code Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">{promoCodes.length} codes total · {activeCount} active</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 font-medium">
          <Plus className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Codes', value: promoCodes.length, icon: Tag, color: 'bg-purple-500', sub: `${activeCount} active` },
          { label: 'Total Uses', value: totalUses.toLocaleString(), icon: Users, color: 'bg-blue-500', sub: 'All time' },
          { label: 'Total Discount', value: `KES ${totalDiscount.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500', sub: 'Given away' },
          { label: 'Active Rate', value: `${promoCodes.length ? Math.round(activeCount / promoCodes.length * 100) : 0}%`, icon: BarChart2, color: 'bg-amber-500', sub: 'Currently active' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
                <div className={`w-9 h-9 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search codes..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive', 'expired'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-sm rounded-xl capitalize transition ${filterStatus === s ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{searchTerm || filterStatus !== 'all' ? 'No matching codes' : 'No promo codes yet'}</p>
            <p className="text-sm text-gray-400 mt-1">Create your first promo code above</p>
          </div>
        ) : (
          filtered.map((promo) => {
            const expired = isExpired(promo)
            const usagePct = promo.max_uses ? Math.min(100, (promo.usage_count / promo.max_uses) * 100) : null
            const almostFull = usagePct !== null && usagePct >= 80

            return (
            <div key={promo.id} className={`bg-white rounded-2xl border hover:shadow-lg transition group overflow-hidden ${expired ? 'border-red-200 opacity-75' : promo.is_active ? 'border-gray-200' : 'border-gray-200 opacity-80'}`}>
              {/* Card top strip */}
              <div className={`h-1.5 w-full ${expired ? 'bg-red-400' : promo.is_active ? 'bg-gradient-to-r from-purple-500 to-violet-600' : 'bg-gray-300'}`} />

              <div className="p-5">
                {/* Code + Status row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${expired ? 'bg-red-100' : promo.is_active ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <Tag className={`w-4 h-4 ${expired ? 'text-red-500' : promo.is_active ? 'text-purple-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-gray-900 font-mono tracking-wide">{promo.code}</h3>
                        <button onClick={() => copyCode(promo.code)} title="Copy code"
                          className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-gray-100">
                          {copiedCode === promo.code
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(promo)} title={promo.is_active ? 'Deactivate' : 'Activate'}
                    className="ml-2 shrink-0 transition">
                    {promo.is_active
                      ? <ToggleRight className="w-7 h-7 text-green-500" />
                      : <ToggleLeft className="w-7 h-7 text-gray-400" />}
                  </button>
                </div>

                {promo.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{promo.description}</p>}

                {/* Discount badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold mb-3 ${expired ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}>
                  {promo.discount_percent
                    ? <><Percent className="w-3.5 h-3.5" />{promo.discount_percent}% off</>
                    : <><DollarSign className="w-3.5 h-3.5" />KES {promo.discount_amount?.toLocaleString()} off</>}
                </div>

                {/* Usage progress */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{promo.usage_count} uses</span>
                    {promo.max_uses ? <span className={almostFull ? 'text-amber-600 font-semibold' : ''}>{promo.max_uses - promo.usage_count} left / {promo.max_uses} max</span> : <span>Unlimited</span>}
                  </div>
                  {usagePct !== null && (
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 80 ? 'bg-amber-500' : 'bg-purple-500'}`}
                        style={{ width: `${usagePct}%` }} />
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs mb-4">
                  {promo.total_discount > 0 && (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />KES {promo.total_discount.toLocaleString()} given
                    </span>
                  )}
                  {promo.expires_at && (
                    <span className={`flex items-center gap-1 ${expired ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {expired ? 'Expired ' : 'Expires '}
                      {new Date(promo.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => openEditModal(promo)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-1.5 font-medium">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(promo.id)}
                    className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-1.5 font-medium">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          )})
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Create Promo Code</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 uppercase"
                  placeholder="SUMMER2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="Summer promotion..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                <select value={formData.discount_type} onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as 'percent' | 'amount' }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.discount_type === 'percent' ? 'Discount Percentage *' : 'Discount Amount (KES) *'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step={formData.discount_type === 'percent' ? '1' : '0.01'}
                  max={formData.discount_type === 'percent' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={e => setFormData(p => ({ ...p, discount_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder={formData.discount_type === 'percent' ? '50' : '100'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={e => setFormData(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500/30"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPromo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Promo Code</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  disabled
                  value={formData.code}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select value={formData.discount_type} onChange={e => setFormData(p => ({ ...p, discount_type: e.target.value as 'percent' | 'amount' }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.discount_type === 'percent' ? 'Discount Percentage' : 'Discount Amount (KES)'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step={formData.discount_type === 'percent' ? '1' : '0.01'}
                  max={formData.discount_type === 'percent' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={e => setFormData(p => ({ ...p, discount_value: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={e => setFormData(p => ({ ...p, max_uses: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={e => setFormData(p => ({ ...p, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500/30"
                />
                <label htmlFor="edit_is_active" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
