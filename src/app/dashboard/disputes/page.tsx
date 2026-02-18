'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertTriangle,
  FileText,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ExternalLink,
} from 'lucide-react'

interface Dispute {
  id: string
  job_id: string
  escrow_id: string
  initiator_id: string
  respondent_id: string
  reason: string
  description?: string
  evidence_urls?: string[]
  status: 'Open' | 'Under Review' | 'Resolved' | 'Dismissed'
  created_at: string
  updated_at: string
  resolution?: string
  job?: { id: string; title: string }
  initiator?: { id: string; full_name: string }
  respondent?: { id: string; full_name: string }
}

const statusConfig: Record<string, { color: string; label: string }> = {
  Open: { color: 'bg-red-50 text-red-700', label: 'Open' },
  'Under Review': { color: 'bg-amber-50 text-amber-700', label: 'Under Review' },
  Resolved: { color: 'bg-green-50 text-green-700', label: 'Resolved' },
  Dismissed: { color: 'bg-gray-50 text-gray-600', label: 'Dismissed' },
}

export default function DisputesPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [formData, setFormData] = useState({
    job_id: '',
    escrow_id: '',
    respondent_id: '',
    reason: '',
    description: '',
    evidence_urls: [] as string[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [evidenceUploading, setEvidenceUploading] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')

  useEffect(() => {
    loadDisputes()
    if (profile?.role === 'Client' || orgMode) {
      loadActiveJobs()
    }
  }, [user, profile, orgMode, activeOrg])

  const loadDisputes = async () => {
    try {
      const res = await fetch('/api/disputes')
      const data = await res.json()
      if (data.disputes) setDisputes(data.disputes)
    } catch {}
    setLoading(false)
  }

  const loadActiveJobs = async () => {
    try {
      const query = orgMode && activeOrg 
        ? `/api/jobs?organization_id=${activeOrg.id}&status=In-Progress&limit=50`
        : `/api/jobs?my=true&status=In-Progress&limit=50`
      const res = await fetch(query)
      const data = await res.json()
      if (data.jobs) setActiveJobs(data.jobs)
    } catch {}
  }

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok) {
        setShowCreateModal(false)
        setFormData({ job_id: '', escrow_id: '', respondent_id: '', reason: '', description: '', evidence_urls: [] })
        loadDisputes()
      } else {
        setError(data.error || 'Failed to create dispute')
      }
    } catch {
      setError('Network error')
    }
    setSubmitting(false)
  }

  const handleEvidenceUpload = async (file: File) => {
    setEvidenceError('')
    setEvidenceUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/disputes/upload', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setEvidenceError(data.error || 'Failed to upload evidence')
        setEvidenceUploading(false)
        return
      }
      if (data.file?.url) {
        setFormData((prev) => ({
          ...prev,
          evidence_urls: [...prev.evidence_urls, data.file.url].slice(0, 5),
        }))
      } else {
        setEvidenceError('Upload succeeded but no URL was returned')
      }
    } catch {
      setEvidenceError('Network error while uploading evidence')
    }
    setEvidenceUploading(false)
  }

  const handleJobSelect = (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId)
    if (job) {
      setFormData(prev => ({
        ...prev,
        job_id: jobId,
        escrow_id: job.escrow_id || '',
        respondent_id: job.freelancer_id || '',
      }))
    }
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Disputes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgMode ? 'Organization disputes and conflicts' : 'Manage disputes and conflicts'}
          </p>
        </div>
        {(profile?.role === 'Client' || orgMode) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> File Dispute
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{disputes.filter(d => d.status === 'Open').length}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{disputes.filter(d => d.status === 'Under Review').length}</p>
              <p className="text-xs text-gray-500">Under Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{disputes.filter(d => d.status === 'Resolved').length}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-600">{disputes.filter(d => d.status === 'Dismissed').length}</p>
              <p className="text-xs text-gray-500">Dismissed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-1">No disputes yet</p>
          <p className="text-gray-500 text-sm mb-5">
            {profile?.role === 'Client' || orgMode 
              ? 'If you have issues with a job or freelancer, you can file a dispute here.'
              : 'You have no disputes at this time.'
            }
          </p>
          {(profile?.role === 'Client' || orgMode) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> File Dispute
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${statusConfig[dispute.status]?.color || 'bg-gray-50 text-gray-600'}`}>
                        {statusConfig[dispute.status]?.label || dispute.status}
                      </span>
                      {dispute.job && (
                        <span className="text-xs text-gray-500">Job: {dispute.job.title}</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-base">{dispute.reason}</p>
                    {dispute.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{dispute.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {dispute.initiator_id === profile?.id ? 'You' : dispute.initiator?.full_name} vs {dispute.respondent_id === profile?.id ? 'You' : dispute.respondent?.full_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Details
                  </button>
                  {dispute.status === 'Open' && (
                    <Link href={`/dashboard/messages?dispute_id=${dispute.id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Discuss
                    </Link>
                  )}
                  {dispute.job && (
                    <Link href={`/jobs/${dispute.job.id}`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> View Job
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dispute Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">File Dispute</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Job *</label>
                <select
                  value={formData.job_id}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                  required
                >
                  <option value="">Choose a job...</option>
                  {activeJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dispute Reason *</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="Quality Issues">Quality Issues</option>
                  <option value="Missed Deadline">Missed Deadline</option>
                  <option value="Communication Problems">Communication Problems</option>
                  <option value="Payment Disagreement">Payment Disagreement</option>
                  <option value="Scope Creep">Scope Creep</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide detailed information about the dispute..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/20 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Evidence (optional)</label>
                {evidenceError && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mb-2">{evidenceError}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx"
                    disabled={evidenceUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleEvidenceUpload(f)
                      e.currentTarget.value = ''
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                  <span className="text-xs text-gray-500">Max 5 files • Up to 20MB each</span>
                </div>
                {formData.evidence_urls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.evidence_urls.map((url, idx) => (
                      <div key={url} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 underline truncate">
                          Evidence {idx + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, evidence_urls: prev.evidence_urls.filter((_, i) => i !== idx) }))}
                          className="text-xs text-gray-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-medium text-amber-800 mb-1">Dispute Resolution Process</p>
                <p className="text-xs text-amber-600">
                  Our team will review your dispute and mediate between both parties. Please provide clear evidence and documentation to support your case.
                </p>
              </div>
            </form>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>File Dispute</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">Dispute Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">ID: {selectedDispute.id}</p>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusConfig[selectedDispute.status]?.color || 'bg-gray-50 text-gray-600'}`}>
                  {statusConfig[selectedDispute.status]?.label || selectedDispute.status}
                </span>
                <span className="text-xs text-gray-500">
                  Created {new Date(selectedDispute.created_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Reason</p>
                <p className="text-sm text-gray-700">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.description && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
                </div>
              )}

              {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Evidence</p>
                  <div className="space-y-2">
                    {selectedDispute.evidence_urls.map((url, idx) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Evidence {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Initiator</p>
                  <p className="text-sm text-gray-700">{selectedDispute.initiator?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Respondent</p>
                  <p className="text-sm text-gray-700">{selectedDispute.respondent?.full_name || 'Unknown'}</p>
                </div>
              </div>

              {selectedDispute.job && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">Related Job</p>
                  <Link href={`/jobs/${selectedDispute.job.id}`} className="text-sm text-blue-600 hover:text-blue-700 underline">
                    {selectedDispute.job.title}
                  </Link>
                </div>
              )}

              {selectedDispute.resolution && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">Resolution</p>
                  <p className="text-sm text-green-700">{selectedDispute.resolution}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
              <Link href={`/dashboard/messages?dispute_id=${selectedDispute.id}`} className="text-sm text-green-600 hover:text-green-700 font-medium px-4 py-2 rounded-lg hover:bg-green-50 transition-colors">
                <MessageSquare className="w-4 h-4 inline mr-1" /> Discuss in Messages
              </Link>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
