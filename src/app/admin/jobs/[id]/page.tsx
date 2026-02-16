'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Briefcase, DollarSign, Eye, Users as UsersIcon,
  Calendar, MapPin, Save, Trash2, CheckCircle2, XCircle, Star, Pencil
} from 'lucide-react'

interface JobDetail {
  id: string; title: string; description: string; status: string
  budget_min: number; budget_max: number; payment_type: string
  skills_required: string[]; tags: string[]; location_preference?: string
  remote_allowed: boolean; requires_verified_only: boolean; requires_swahili: boolean
  min_hustle_score: number; views_count: number; proposals_count: number
  is_boosted: boolean; deadline?: string; created_at: string
  client?: { id: string; full_name: string; avatar_url?: string; email?: string; verification_status: string; hustle_score: number; location?: string; county?: string }
}

const statuses = ['Draft', 'Open', 'In-Progress', 'Completed', 'Disputed', 'Cancelled']
const statusColor: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-500', Open: 'bg-green-100 text-green-700',
  'In-Progress': 'bg-blue-100 text-blue-700', Completed: 'bg-gray-200 text-gray-700',
  Disputed: 'bg-red-100 text-red-700', Cancelled: 'bg-yellow-100 text-yellow-700',
}

export default function AdminJobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [proposals, setProposals] = useState<Array<{
    id: string; bid_amount: number; status: string; submitted_at: string
    freelancer?: { id: string; full_name: string; hustle_score: number; verification_status: string }
  }>>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/admin/jobs/${params.id}`).then(r => r.json()).then(data => {
      setJob(data.job)
      setProposals(data.proposals || [])
      if (data.job) initForm(data.job)
    }).finally(() => setLoading(false))
  }, [params.id])

  const initForm = (j: JobDetail) => {
    setFormData({
      title: j.title, description: j.description, status: j.status,
      budget_min: j.budget_min, budget_max: j.budget_max, payment_type: j.payment_type,
      skills_required: j.skills_required || [], location_preference: j.location_preference || '',
      remote_allowed: j.remote_allowed, requires_verified_only: j.requires_verified_only,
      requires_swahili: j.requires_swahili, min_hustle_score: j.min_hustle_score,
      is_boosted: j.is_boosted, deadline: j.deadline || '',
    })
  }

  const handleSave = async () => {
    setSaving(true); setMessage(null)
    try {
      const res = await fetch(`/api/admin/jobs/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setJob(data.job)
        initForm(data.job)
        setEditMode(false)
        setMessage({ type: 'success', text: 'Job updated successfully — changes are live on frontend' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this job permanently?')) return
    const res = await fetch(`/api/admin/jobs/${params.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin/jobs')
    else setMessage({ type: 'error', text: 'Failed to delete job' })
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-48" /><div className="bg-white rounded-xl border p-6"><div className="h-48 bg-gray-100 rounded" /></div></div>

  if (!job) return <p className="text-red-500">Job not found</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-500">Job ID: {job.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Job
            </button>
          ) : (
            <>
              <button onClick={() => { setEditMode(false); if (job) initForm(job) }} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Job Details</h2>
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input type="text" value={formData.title as string || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea rows={6} value={formData.description as string || ''} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Budget Min (KES)</label>
                    <input type="number" min={0} value={formData.budget_min as number || 0} onChange={e => setFormData(p => ({ ...p, budget_min: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Budget Max (KES)</label>
                    <input type="number" min={0} value={formData.budget_max as number || 0} onChange={e => setFormData(p => ({ ...p, budget_max: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
                    <select value={formData.payment_type as string || 'Fixed'} onChange={e => setFormData(p => ({ ...p, payment_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                      <option value="Fixed">Fixed</option><option value="Hourly">Hourly</option><option value="Milestone">Milestone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                    <input type="text" value={formData.location_preference as string || ''} onChange={e => setFormData(p => ({ ...p, location_preference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                    <input type="date" value={formData.deadline as string || ''} onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Min Hustle Score</label>
                    <input type="number" min={0} max={100} value={formData.min_hustle_score as number || 0} onChange={e => setFormData(p => ({ ...p, min_hustle_score: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Skills Required (comma-separated)</label>
                  <input type="text" value={(formData.skills_required as string[] || []).join(', ')} onChange={e => setFormData(p => ({ ...p, skills_required: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.remote_allowed} onChange={e => setFormData(p => ({ ...p, remote_allowed: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    Remote Allowed
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.requires_verified_only} onChange={e => setFormData(p => ({ ...p, requires_verified_only: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    Verified Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.requires_swahili} onChange={e => setFormData(p => ({ ...p, requires_swahili: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    Requires Swahili
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.is_boosted} onChange={e => setFormData(p => ({ ...p, is_boosted: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    Boosted
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="prose prose-sm max-w-none text-gray-600 mb-4">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600"><DollarSign className="w-4 h-4 text-gray-400" /> KES {job.budget_min.toLocaleString()} – {job.budget_max.toLocaleString()}</div>
                  <div className="flex items-center gap-2 text-gray-600"><Briefcase className="w-4 h-4 text-gray-400" /> {job.payment_type}</div>
                  <div className="flex items-center gap-2 text-gray-600"><Eye className="w-4 h-4 text-gray-400" /> {job.views_count} views</div>
                  <div className="flex items-center gap-2 text-gray-600"><UsersIcon className="w-4 h-4 text-gray-400" /> {job.proposals_count} proposals</div>
                  {job.location_preference && <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /> {job.location_preference}</div>}
                  <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" /> {new Date(job.created_at).toLocaleDateString()}</div>
                </div>
                {job.skills_required?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Skills Required</p>
                    <div className="flex flex-wrap gap-1.5">{job.skills_required.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}</div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4 text-xs">
                  {job.remote_allowed && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Remote OK</span>}
                  {job.requires_verified_only && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Verified Only</span>}
                  {job.requires_swahili && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Swahili</span>}
                  {job.is_boosted && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Boosted</span>}
                </div>
              </>
            )}
          </div>

          {/* Proposals */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Proposals ({proposals.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {proposals.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No proposals yet</p>
              ) : proposals.map(p => (
                <div key={p.id} className="p-4 hover:bg-gray-50 transition flex items-center gap-4">
                  <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
                    {p.freelancer?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/users/${p.freelancer?.id}`} className="text-sm font-medium text-gray-900 hover:text-green-600">{p.freelancer?.full_name || 'Unknown'}</Link>
                    <p className="text-xs text-gray-500">Score: {p.freelancer?.hustle_score || 0} · {p.freelancer?.verification_status}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">KES {p.bid_amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'Accepted' ? 'bg-green-100 text-green-700' : p.status === 'Rejected' ? 'bg-red-100 text-red-700' : p.status === 'Withdrawn' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Status</h2>
            <div className="flex items-center gap-2">
              <span className={`text-sm px-3 py-1 rounded-full ${statusColor[job.status] || 'bg-gray-100 text-gray-600'}`}>{job.status}</span>
            </div>
            {editMode && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Change Status</label>
                  <select value={formData.status as string} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Client */}
          {job.client && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Client</h2>
              <Link href={`/admin/users/${job.client.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition -mx-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold shrink-0">
                  {job.client.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.client.full_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {job.client.hustle_score} · {job.client.verification_status}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
