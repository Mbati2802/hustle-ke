'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Tag, Search, Plus, X, CheckCircle2, XCircle, Loader2,
  Edit2, Trash2, Eye, Calendar, Percent, DollarSign
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-7 h-7 text-purple-500" /> Promo Code Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">{promoCodes.length} promo codes</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Promo Code
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))
        ) : promoCodes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">No promo codes yet</div>
        ) : (
          promoCodes.map((promo) => (
            <div key={promo.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-lg text-gray-900">{promo.code}</h3>
                </div>
                {promo.is_active ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Inactive</span>
                )}
              </div>

              {promo.description && (
                <p className="text-sm text-gray-600 mb-4">{promo.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  {promo.discount_percent ? (
                    <>
                      <Percent className="w-4 h-4 text-purple-500" />
                      <span className="font-semibold text-purple-600">{promo.discount_percent}% off</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 text-purple-500" />
                      <span className="font-semibold text-purple-600">KES {promo.discount_amount} off</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Used {promo.usage_count} times</span>
                  {promo.max_uses && <span className="text-gray-400">/ {promo.max_uses} max</span>}
                </div>

                {promo.expires_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Expires {new Date(promo.expires_at).toLocaleDateString()}</span>
                  </div>
                )}

                {promo.total_discount > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    Total discount given: KES {promo.total_discount.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button onClick={() => openEditModal(promo)} className="flex-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-1">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(promo.id)} className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
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
