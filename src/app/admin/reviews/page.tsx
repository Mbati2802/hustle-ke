'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Star, ChevronLeft, ChevronRight, X, Eye, EyeOff, Trash2, MoreVertical,
  Pencil, Save, Loader2, CheckCircle2, XCircle
} from 'lucide-react'

interface Review {
  id: string; rating: number; comment?: string; is_public: boolean; created_at: string
  communication_rating?: number; quality_rating?: number; timeliness_rating?: number
  reviewer?: { id: string; full_name: string; email: string }
  reviewee?: { id: string; full_name: string; email: string }
  job?: { id: string; title: string }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [editReview, setEditReview] = useState<Review | null>(null)
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', communication_rating: 0, quality_rating: 0, timeliness_rating: 0 })
  const [editSaving, setEditSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (visibilityFilter) params.set('is_public', visibilityFilter)
    try {
      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch { /* */ }
    setLoading(false)
  }, [page, visibilityFilter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleToggleVisibility = async (id: string, currentlyPublic: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !currentlyPublic }),
    })
    fetchReviews()
    setActionMenu(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this review?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    fetchReviews()
    setActionMenu(null)
  }

  const openEdit = (r: Review) => {
    setEditReview(r)
    setEditForm({
      rating: r.rating, comment: r.comment || '',
      communication_rating: r.communication_rating || 0,
      quality_rating: r.quality_rating || 0,
      timeliness_rating: r.timeliness_rating || 0,
    })
    setActionMenu(null)
  }

  const handleEditSave = async () => {
    if (!editReview) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${editReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Review updated — visible on frontend' })
        setEditReview(null)
        fetchReviews()
      } else {
        setMessage({ type: 'error', text: 'Failed to update review' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setEditSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-7 h-7 text-amber-400 fill-amber-400" /> Reviews
        </h1>
        <p className="text-sm text-gray-500 mt-1">{total} total reviews</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={visibilityFilter} onChange={e => { setVisibilityFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Reviews</option>
            <option value="true">Public</option>
            <option value="false">Hidden</option>
          </select>
          {visibilityFilter && (
            <button onClick={() => { setVisibilityFilter(''); setPage(1) }} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Job</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reviewer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reviewee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Comment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Visibility</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse">{[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>)}</tr>)
              ) : reviews.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No reviews found</td></tr>
              ) : reviews.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">
                    {r.job ? <Link href={`/admin/jobs/${r.job.id}`} className="hover:text-green-600">{r.job.title}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.reviewer ? <Link href={`/admin/users/${r.reviewer.id}`} className="hover:text-green-600">{r.reviewer.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {r.reviewee ? <Link href={`/admin/users/${r.reviewee.id}`} className="hover:text-green-600">{r.reviewee.full_name}</Link> : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{r.comment || '—'}</td>
                  <td className="px-4 py-3">
                    {r.is_public ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1 w-fit"><Eye className="w-3 h-3" /> Public</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1 w-fit"><EyeOff className="w-3 h-3" /> Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right relative">
                    <button onClick={() => setActionMenu(actionMenu === r.id ? null : r.id)} className="p-1 hover:bg-gray-100 rounded transition">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {actionMenu === r.id && (
                      <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40">
                        <button onClick={() => openEdit(r)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleToggleVisibility(r.id, r.is_public)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left">
                          {r.is_public ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Show</>}
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm text-gray-700 px-2">Page {page}</span>
              <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Review Modal */}
      {editReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditReview(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Edit Review</h2>
              <button onClick={() => setEditReview(null)} className="p-1 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Overall Rating (1-5)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setEditForm(p => ({ ...p, rating: n }))}
                      className="p-0.5 hover:scale-110 transition">
                      <Star className={`w-6 h-6 ${n <= editForm.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Comment</label>
                <textarea rows={3} value={editForm.comment} onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Communication</label>
                  <input type="number" min={0} max={5} value={editForm.communication_rating} onChange={e => setEditForm(p => ({ ...p, communication_rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quality</label>
                  <input type="number" min={0} max={5} value={editForm.quality_rating} onChange={e => setEditForm(p => ({ ...p, quality_rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Timeliness</label>
                  <input type="number" min={0} max={5} value={editForm.timeliness_rating} onChange={e => setEditForm(p => ({ ...p, timeliness_rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setEditReview(null)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button onClick={handleEditSave} disabled={editSaving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
