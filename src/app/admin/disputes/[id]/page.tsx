'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, AlertTriangle, DollarSign, MessageSquare,
  CheckCircle2, XCircle, Save, User, Clock
} from 'lucide-react'

interface DisputeDetail {
  id: string; reason: string; description?: string; status: string
  resolution?: string; resolved_at?: string; created_at: string
  evidence_urls?: string[]; refund_amount?: number; release_amount?: number
  job_id: string
  job?: { id: string; title: string; status: string; description: string }
  initiator?: { id: string; full_name: string; email: string; avatar_url?: string }
  respondent?: { id: string; full_name: string; email: string; avatar_url?: string }
  escrow?: { id: string; amount: number; status: string; service_fee: number; tax_amount: number; client_id: string; freelancer_id: string }
}

interface Msg {
  id: string; content: string; created_at: string
  sender?: { id: string; full_name: string }
}

export default function AdminDisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Resolution form
  const [action, setAction] = useState<'release_to_freelancer' | 'refund_to_client' | 'split'>('release_to_freelancer')
  const [resolution, setResolution] = useState('')
  const [splitPct, setSplitPct] = useState(50)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/admin/disputes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setDispute(data.dispute)
        setMessages(data.messages || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const handleResolve = async () => {
    if (resolution.length < 10) {
      setMessage({ type: 'error', text: 'Resolution must be at least 10 characters' })
      return
    }
    setSaving(true); setMessage(null)
    try {
      const res = await fetch(`/api/admin/disputes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolution, split_freelancer_pct: splitPct }),
      })
      const data = await res.json()
      if (res.ok) {
        setDispute(data.dispute)
        setMessage({ type: 'success', text: `Dispute resolved. Released: KES ${data.release_amount?.toLocaleString() || 0}, Refunded: KES ${data.refund_amount?.toLocaleString() || 0}` })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to resolve' })
      }
    } catch { setMessage({ type: 'error', text: 'Network error' }) }
    setSaving(false)
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-48" /><div className="bg-white rounded-xl border p-6"><div className="h-48 bg-gray-100 rounded" /></div></div>

  if (!dispute) return <p className="text-red-500">Dispute not found</p>

  const escrowAmount = dispute.escrow?.amount || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Dispute
          </h1>
          <p className="text-sm text-gray-500">ID: {dispute.id.slice(0, 8)}... · {dispute.status}</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Dispute Details</h2>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Reason</p>
              <p className="text-sm text-red-700">{dispute.reason}</p>
            </div>
            {dispute.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Additional Details</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{dispute.description}</p>
              </div>
            )}
            {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Evidence</p>
                <div className="flex flex-wrap gap-2">
                  {dispute.evidence_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                      Evidence #{i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {dispute.status === 'Resolved' && dispute.resolution && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-1">Resolution</p>
                <p className="text-sm text-green-700">{dispute.resolution}</p>
                {dispute.resolved_at && <p className="text-xs text-green-500 mt-2">Resolved on {new Date(dispute.resolved_at).toLocaleString()}</p>}
              </div>
            )}
          </div>

          {/* Job Messages */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Job Messages ({messages.length})</h2>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
              {messages.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No messages</p>
              ) : messages.map(m => (
                <div key={m.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{m.sender?.full_name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600">{m.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Form */}
          {dispute.status === 'Open' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Resolve Dispute</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 'release_to_freelancer' as const, label: 'Release to Freelancer', desc: `Full KES ${escrowAmount.toLocaleString()} to freelancer`, color: 'border-green-500 bg-green-50' },
                    { value: 'refund_to_client' as const, label: 'Refund to Client', desc: `Full KES ${escrowAmount.toLocaleString()} to client`, color: 'border-blue-500 bg-blue-50' },
                    { value: 'split' as const, label: 'Split Amount', desc: 'Divide between both parties', color: 'border-amber-500 bg-amber-50' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAction(opt.value)}
                      className={`p-3 rounded-lg border-2 text-left transition ${action === opt.value ? opt.color : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {action === 'split' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freelancer gets: {splitPct}% (KES {Math.round(escrowAmount * splitPct / 100).toLocaleString()}) · Client gets: {100 - splitPct}% (KES {Math.round(escrowAmount * (100 - splitPct) / 100).toLocaleString()})
                  </label>
                  <input type="range" min={0} max={100} value={splitPct} onChange={e => setSplitPct(parseInt(e.target.value))} className="w-full accent-green-600" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Explanation</label>
                <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={4} placeholder="Explain the resolution decision (min 10 chars)..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
              </div>

              <button onClick={handleResolve} disabled={saving || resolution.length < 10}
                className="w-full px-4 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                <Save className="w-4 h-4" /> {saving ? 'Resolving...' : 'Resolve Dispute'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Parties</h2>
            {dispute.initiator && (
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Initiator</p>
                <Link href={`/admin/users/${dispute.initiator.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg -mx-2 transition">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 text-sm font-bold">{dispute.initiator.full_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dispute.initiator.full_name}</p>
                    <p className="text-xs text-gray-500">{dispute.initiator.email}</p>
                  </div>
                </Link>
              </div>
            )}
            {dispute.respondent && (
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Respondent</p>
                <Link href={`/admin/users/${dispute.respondent.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg -mx-2 transition">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-bold">{dispute.respondent.full_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dispute.respondent.full_name}</p>
                    <p className="text-xs text-gray-500">{dispute.respondent.email}</p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Escrow */}
          {dispute.escrow && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Escrow</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">KES {dispute.escrow.amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="text-gray-700">KES {dispute.escrow.service_fee.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="text-gray-700">KES {dispute.escrow.tax_amount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`text-xs px-2 py-0.5 rounded-full ${dispute.escrow.status === 'Disputed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{dispute.escrow.status}</span></div>
              </div>
            </div>
          )}

          {/* Job */}
          {dispute.job && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Related Job</h2>
              <Link href={`/admin/jobs/${dispute.job.id}`} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <p className="text-sm font-medium text-gray-900">{dispute.job.title}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {dispute.job.status}</p>
              </Link>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-700">{new Date(dispute.created_at).toLocaleString()}</span></div>
            {dispute.resolved_at && <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span className="text-gray-700">{new Date(dispute.resolved_at).toLocaleString()}</span></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
