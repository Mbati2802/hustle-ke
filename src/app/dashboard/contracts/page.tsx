'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import {
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  X,
  Briefcase,
  User,
  Shield,
  Loader2,
  ArrowRight,
  MapPin,
  Tag,
} from 'lucide-react'

interface Proposal {
  id: string
  status: string
  bid_amount: number
  cover_letter: string
  delivery_time: string
  created_at: string
  updated_at: string
  job_id: string
  jobs?: {
    id: string
    title: string
    description: string
    category: string
    budget_min: number
    budget_max: number
    deadline: string
    skills: string[]
    status: string
  } | null
  freelancer?: { full_name: string; email: string; county: string } | null
  client?: { full_name: string; email: string; county: string } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  Accepted: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  'In Progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  Completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600', icon: XCircle },
}

export default function ContractsPage() {
  const { profile } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<Proposal | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/proposals')
      const data = await res.json()
      if (data.proposals) {
        // Only show accepted/completed proposals (these are "contracts")
        setProposals(data.proposals.filter((p: Proposal) => 
          ['Accepted', 'In Progress', 'Completed', 'Cancelled'].includes(p.status)
        ))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  const isFreelancer = profile?.role === 'Freelancer'

  const filteredContracts = proposals.filter(p => {
    if (filter === 'active') return p.status === 'Accepted' || p.status === 'In Progress'
    if (filter === 'completed') return p.status === 'Completed'
    return true
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <div className="p-4 lg:p-6 xl:p-8 animate-pulse">
        <div className="h-7 w-36 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-56 bg-gray-100 rounded mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isFreelancer ? 'Your active and past work agreements' : 'Agreements with hired freelancers'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f} ({f === 'all' ? proposals.length : proposals.filter(p => f === 'active' ? (p.status === 'Accepted' || p.status === 'In Progress') : p.status === 'Completed').length})
            </button>
          ))}
        </div>
      </div>

      {/* Contracts list */}
      {filteredContracts.length > 0 ? (
        <div className="space-y-4">
          {filteredContracts.map(contract => {
            const cfg = statusConfig[contract.status] || statusConfig.Accepted
            const StatusIcon = cfg.icon
            return (
              <div key={contract.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                      {contract.jobs?.category && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {contract.jobs.category}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {contract.jobs?.title || 'Project'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedContract(contract)}
                    className="shrink-0 text-green-600 hover:text-green-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> KES {contract.bid_amount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {contract.delivery_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Started {formatDate(contract.updated_at)}
                  </span>
                  {contract.jobs?.deadline && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Deadline: {formatDate(contract.jobs.deadline)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">
            {filter !== 'all' ? `No ${filter} contracts` : 'No contracts yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isFreelancer
              ? 'Contracts are created when your proposals are accepted.'
              : 'Contracts are created when you accept a freelancer\'s proposal.'}
          </p>
          <Link
            href={isFreelancer ? '/jobs' : '/post-job'}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {isFreelancer ? 'Browse Jobs →' : 'Post a Job →'}
          </Link>
        </div>
      )}

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
              <h3 className="font-bold text-gray-900">Contract Details</h3>
              <button onClick={() => setSelectedContract(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Contract header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedContract.jobs?.title || 'Project'}</h2>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = statusConfig[selectedContract.status] || statusConfig.Accepted
                      const StatusIcon = cfg.icon
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">KES {selectedContract.bid_amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Agreed Amount</p>
                </div>
              </div>

              {/* Key terms */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Delivery Time</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedContract.delivery_time}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Contract Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedContract.updated_at)}</p>
                </div>
                {selectedContract.jobs?.deadline && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Deadline</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedContract.jobs.deadline)}</p>
                  </div>
                )}
                {selectedContract.jobs?.category && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Category</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedContract.jobs.category}</p>
                  </div>
                )}
              </div>

              {/* Scope of work */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Proposal / Scope
                </h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedContract.cover_letter}</p>
                </div>
              </div>

              {/* Skills */}
              {selectedContract.jobs?.skills && selectedContract.jobs.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedContract.jobs.skills.map(s => (
                      <span key={s} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Protection notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Protected by HustleKE Escrow</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Funds are held securely in escrow until work is completed and approved. Both parties are protected.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/messages?job=${selectedContract.job_id}`}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Messages <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard/escrow"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  View Escrow <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
