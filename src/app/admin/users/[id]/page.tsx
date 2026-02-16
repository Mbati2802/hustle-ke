'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Shield, ShieldCheck, Star, Briefcase, DollarSign,
  AlertTriangle, Save, Trash2, Mail, Phone, MapPin, Calendar,
  CheckCircle2, XCircle, Clock
} from 'lucide-react'

interface UserProfile {
  id: string; user_id: string; full_name: string; email: string; phone?: string
  location?: string; county?: string; avatar_url?: string; bio?: string
  skills: string[]; hourly_rate?: number; title?: string; mpesa_phone?: string
  mpesa_verified: boolean; verification_status: string; id_verified: boolean
  skill_tested: boolean; ai_score: number; hustle_score: number
  total_earned: number; jobs_completed: number; jobs_posted: number
  role: string; languages: string[]; swahili_speaking: boolean
  created_at: string; updated_at: string
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<{ jobs_posted: number; proposals_sent: number; disputes: number }>({ jobs_posted: 0, proposals_sent: 0, disputes: 0 })
  const [wallet, setWallet] = useState<{ balance: number; pending_balance: number; total_earned: number; total_withdrawn: number } | null>(null)
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; comment?: string; reviewer?: { full_name: string }; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/admin/users/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setProfile(data.profile)
        setStats(data.stats || { jobs_posted: 0, proposals_sent: 0, disputes: 0 })
        setWallet(data.wallet)
        setReviews(data.recent_reviews || [])
        setFormData({
          full_name: data.profile?.full_name || '',
          email: data.profile?.email || '',
          phone: data.profile?.phone || '',
          role: data.profile?.role || 'Freelancer',
          verification_status: data.profile?.verification_status || 'Unverified',
          title: data.profile?.title || '',
          hustle_score: data.profile?.hustle_score || 0,
          hourly_rate: data.profile?.hourly_rate || 0,
          location: data.profile?.location || '',
          county: data.profile?.county || '',
          mpesa_phone: data.profile?.mpesa_phone || '',
          mpesa_verified: data.profile?.mpesa_verified || false,
          swahili_speaking: data.profile?.swahili_speaking || false,
          skills: data.profile?.skills || [],
          bio: data.profile?.bio || '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data.profile)
        setEditMode(false)
        setMessage({ type: 'success', text: 'User updated successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this user and all their data? This cannot be undone.')) return
    const res = await fetch(`/api/admin/users/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin/users')
    } else {
      setMessage({ type: 'error', text: 'Failed to delete user' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="bg-white rounded-xl border p-6"><div className="h-32 bg-gray-100 rounded" /></div>
      </div>
    )
  }

  if (!profile) return <p className="text-red-500">User not found</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button onClick={() => setEditMode(true)} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Edit User
            </button>
          ) : (
            <>
              <button onClick={() => setEditMode(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
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
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <input type="text" value={formData.full_name as string || ''} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={formData.email as string || ''} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="text" value={formData.phone as string || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="254712345678" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                  <select value={formData.role as string || 'Freelancer'} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="Freelancer">Freelancer</option>
                    <option value="Client">Client</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Verification Status</label>
                  <select value={formData.verification_status as string || 'Unverified'} onChange={e => setFormData(p => ({ ...p, verification_status: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30">
                    <option value="Unverified">Unverified</option>
                    <option value="ID-Verified">ID-Verified</option>
                    <option value="Skill-Tested">Skill-Tested</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input type="text" value={formData.title as string || ''} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="e.g., Full-Stack Developer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hustle Score</label>
                  <input type="number" min={0} max={100} value={formData.hustle_score as number || 0} onChange={e => setFormData(p => ({ ...p, hustle_score: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hourly Rate (KES)</label>
                  <input type="number" min={0} value={formData.hourly_rate as number || 0} onChange={e => setFormData(p => ({ ...p, hourly_rate: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                  <input type="text" value={formData.location as string || ''} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Nairobi CBD" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">County</label>
                  <input type="text" value={formData.county as string || ''} onChange={e => setFormData(p => ({ ...p, county: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Nairobi" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Phone</label>
                  <input type="text" value={formData.mpesa_phone as string || ''} onChange={e => setFormData(p => ({ ...p, mpesa_phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="254712345678" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.swahili_speaking} onChange={e => setFormData(p => ({ ...p, swahili_speaking: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    Swahili Speaker
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={!!formData.mpesa_verified} onChange={e => setFormData(p => ({ ...p, mpesa_verified: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600" />
                    M-Pesa Verified
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Skills (comma-separated)</label>
                  <input type="text" value={(formData.skills as string[] || []).join(', ')} onChange={e => setFormData(p => ({ ...p, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" placeholder="Web Development, UI/UX Design" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                  <textarea value={formData.bio as string || ''} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xl font-bold shrink-0">
                    {profile.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{profile.full_name}</p>
                    {profile.title && <p className="text-sm text-gray-600">{profile.title}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${profile.role === 'Admin' ? 'bg-purple-100 text-purple-700' : profile.role === 'Client' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{profile.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${profile.verification_status === 'Skill-Tested' ? 'bg-green-100 text-green-700' : profile.verification_status === 'ID-Verified' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {profile.verification_status === 'Skill-Tested' ? <ShieldCheck className="w-3 h-3" /> : profile.verification_status === 'ID-Verified' ? <Shield className="w-3 h-3" /> : null}
                        {profile.verification_status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" /> {profile.email}</div>
                  {profile.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" /> {profile.phone}</div>}
                  {profile.location && <div className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" /> {profile.location}{profile.county ? `, ${profile.county}` : ''}</div>}
                  <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" /> Joined {new Date(profile.created_at).toLocaleDateString()}</div>
                </div>
                {profile.bio && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{profile.bio}</p>}
                {profile.skills?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map(s => <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Recent Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">by {r.reviewer?.full_name || 'Anonymous'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-6">
          {/* Key stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Hustle Score</span>
                <span className="text-sm font-bold text-gray-900">{profile.hustle_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Jobs Completed</span>
                <span className="text-sm font-bold text-gray-900">{profile.jobs_completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2"><Briefcase className="w-4 h-4 text-green-500" /> Jobs Posted</span>
                <span className="text-sm font-bold text-gray-900">{stats.jobs_posted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Total Earned</span>
                <span className="text-sm font-bold text-gray-900">KES {profile.total_earned.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Disputes</span>
                <span className="text-sm font-bold text-gray-900">{stats.disputes}</span>
              </div>
            </div>
          </div>

          {/* Wallet */}
          {wallet && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Wallet</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Balance</span>
                  <span className="text-sm font-bold text-green-600">KES {wallet.balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="text-sm text-gray-700">KES {wallet.pending_balance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Earned</span>
                  <span className="text-sm text-gray-700">KES {wallet.total_earned.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total Withdrawn</span>
                  <span className="text-sm text-gray-700">KES {wallet.total_withdrawn.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            <button onClick={() => { setFormData(p => ({ ...p, verification_status: 'ID-Verified', id_verified: true })); setEditMode(true) }} className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-left flex items-center gap-2">
              <Shield className="w-4 h-4" /> Verify ID
            </button>
            <button onClick={() => { setFormData(p => ({ ...p, verification_status: 'Skill-Tested', skill_tested: true })); setEditMode(true) }} className="w-full px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-left flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Mark Skill-Tested
            </button>
            <button onClick={() => { setFormData(p => ({ ...p, role: 'Admin' })); setEditMode(true) }} className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-left flex items-center gap-2">
              <Shield className="w-4 h-4" /> Promote to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
