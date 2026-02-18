'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  User,
  Briefcase,
  TrendingUp,
  ArrowDownRight,
  Filter,
  FileText,
  FileSpreadsheet,
  Download,
} from 'lucide-react'

interface Escrow {
  id: string
  job_id: string
  proposal_id: string
  client_id: string
  freelancer_id: string
  amount: number
  service_fee: number
  tax_amount: number
  status: string
  initiated_at: string
  released_at?: string
  job?: { id: string; title: string; status: string }
  client?: { id: string; full_name: string }
  freelancer?: { id: string; full_name: string }
}

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  Pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, label: 'Pending' },
  Held: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Shield, label: 'Held in Escrow' },
  Released: { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2, label: 'Released' },
  Refunded: { color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: XCircle, label: 'Refunded' },
  Disputed: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle, label: 'Disputed' },
}

type FilterTab = 'all' | 'Held' | 'Pending' | 'Released' | 'Refunded'

export default function EscrowPage() {
  const { user, profile, orgMode, activeOrg } = useAuth()
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [releasing, setReleasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [downloading, setDownloading] = useState<string | null>(null)

  const hasMounted = useRef(false)

  useEffect(() => {
    if (!user) return
    if (!hasMounted.current) {
      hasMounted.current = true
      const query = orgMode && activeOrg ? `/api/escrow?organization_id=${activeOrg.id}` : '/api/escrow'
      const cached = cachedFetch<{ escrows?: Escrow[] }>(query, d => {
        if (d.escrows) setEscrows(d.escrows)
        setLoading(false)
      })
      if (cached?.escrows) {
        setEscrows(cached.escrows)
        setLoading(false)
      }
    } else {
      fetch(orgMode && activeOrg ? `/api/escrow?organization_id=${activeOrg.id}` : '/api/escrow')
        .then(r => r.json())
        .then(data => { if (data.escrows) setEscrows(data.escrows) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [user, orgMode, activeOrg])

  const refreshEscrows = async () => {
    try {
      const res = await fetch(orgMode && activeOrg ? `/api/escrow?organization_id=${activeOrg.id}` : '/api/escrow')
      const data = await res.json()
      if (data.escrows) setEscrows(data.escrows)
    } catch {}
  }

  const handleRelease = async (escrowId: string) => {
    if (!confirm('Release funds to the freelancer? This cannot be undone.')) return
    setReleasing(escrowId)
    setMessage(null)
    try {
      const res = await fetch(`/api/escrow/${escrowId}/release`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: `Funds released! KES ${data.net_amount?.toLocaleString() || ''} sent to freelancer.` })
        await refreshEscrows()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to release funds' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
    setReleasing(null)
  }

  const handleRefund = async (escrowId: string) => {
    if (!confirm('Request a refund? This will return funds to your wallet.')) return
    setReleasing(escrowId)
    setMessage(null)
    try {
      const res = await fetch(`/api/escrow/${escrowId}/refund`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Refund processed successfully!' })
        await refreshEscrows()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to process refund' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    }
    setReleasing(null)
  }

  const handleDownloadReport = async (format: 'pdf' | 'excel') => {
    setDownloading(format)
    try {
      const query = orgMode && activeOrg
        ? `/api/reports/financial?format=${format}&organization_id=${activeOrg.id}`
        : `/api/reports/financial?format=${format}`
      const res = await fetch(query)
      if (!res.ok) {
        setMessage({ type: 'error', text: 'Failed to generate report. Please try again.' })
        setDownloading(null)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'pdf' ? 'pdf' : 'xlsx'
      const prefix = orgMode && activeOrg ? 'Org_Financial_Report' : 'Financial_Report'
      a.download = `HustleKE_${prefix}_${new Date().toISOString().slice(0, 10)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setMessage({ type: 'error', text: 'Network error downloading report.' })
    }
    setDownloading(null)
  }

  const isClient = (orgMode && activeOrg) ? true : profile?.role === 'Client'
  const totalHeld = escrows.filter(e => e.status === 'Held').reduce((sum, e) => sum + e.amount, 0)
  const totalPending = escrows.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0)
  const totalReleased = escrows.filter(e => e.status === 'Released').reduce((sum, e) => sum + e.amount, 0)
  const totalRefunded = escrows.filter(e => e.status === 'Refunded').reduce((sum, e) => sum + e.amount, 0)
  const netEarnings = escrows
    .filter(e => e.status === 'Released')
    .reduce((sum, e) => sum + (e.amount - e.service_fee - e.tax_amount), 0)

  const filteredEscrows = activeFilter === 'all' ? escrows : escrows.filter(e => e.status === activeFilter)

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: escrows.length },
    { key: 'Held', label: 'Active', count: escrows.filter(e => e.status === 'Held').length },
    { key: 'Pending', label: 'Pending', count: escrows.filter(e => e.status === 'Pending').length },
    { key: 'Released', label: 'Released', count: escrows.filter(e => e.status === 'Released').length },
    { key: 'Refunded', label: 'Refunded', count: escrows.filter(e => e.status === 'Refunded').length },
  ]

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-600" />
              {orgMode && activeOrg ? `${activeOrg.name} Escrow` : 'Escrow'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Secure payments between clients and freelancers</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleDownloadReport('pdf')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs transition-colors border border-red-200 disabled:opacity-50"
            >
              {downloading === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PDF Report</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => handleDownloadReport('excel')}
              disabled={!!downloading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium text-xs transition-colors border border-green-200 disabled:opacity-50"
            >
              {downloading === 'excel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Excel Report</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
        </div>

        {/* Toast */}
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Held / Active */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[40px] flex items-end justify-start p-2">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Held</p>
            <p className="text-xl font-bold text-gray-900">KES {totalHeld.toLocaleString()}</p>
            <p className="text-[11px] text-blue-600 mt-1">
              {escrows.filter(e => e.status === 'Held').length} active escrow{escrows.filter(e => e.status === 'Held').length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-[40px] flex items-end justify-start p-2">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-xl font-bold text-gray-900">KES {totalPending.toLocaleString()}</p>
            <p className="text-[11px] text-amber-600 mt-1">
              {escrows.filter(e => e.status === 'Pending').length} awaiting funding
            </p>
          </div>

          {/* Released */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-[40px] flex items-end justify-start p-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Released</p>
            <p className="text-xl font-bold text-green-600">KES {totalReleased.toLocaleString()}</p>
            <p className="text-[11px] text-green-600 mt-1">
              {isClient ? 'Paid out' : `Net: KES ${netEarnings.toLocaleString()}`}
            </p>
          </div>

          {/* Refunded */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-[40px] flex items-end justify-start p-2">
              <ArrowDownRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Refunded</p>
            <p className="text-xl font-bold text-gray-900">KES {totalRefunded.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {escrows.filter(e => e.status === 'Refunded').length} refunded
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === tab.key ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Escrow List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="h-20 bg-gray-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredEscrows.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium mb-1">
              {activeFilter === 'all' ? 'No escrow transactions yet' : `No ${activeFilter.toLowerCase()} escrows`}
            </p>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {activeFilter === 'all'
                ? 'When you hire a freelancer or get hired, escrow protects both parties by holding funds securely until the job is done.'
                : 'Try a different filter to see other transactions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEscrows.map((escrow) => {
              const config = statusConfig[escrow.status] || statusConfig.Pending
              const StatusIcon = config.icon
              const netAmount = escrow.amount - escrow.service_fee - escrow.tax_amount
              const otherParty = isClient ? escrow.freelancer : escrow.client
              const otherLabel = isClient ? 'Freelancer' : 'Client'

              return (
                <div key={escrow.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="px-5 py-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/jobs/${escrow.job_id}`}
                            className="font-semibold text-gray-900 hover:text-green-600 transition-colors line-clamp-1 flex items-center gap-1"
                          >
                            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {escrow.job?.title || 'Untitled Job'}
                            <ArrowUpRight className="w-3 h-3 text-gray-300" />
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {otherLabel}: <span className="font-medium text-gray-700">{otherParty?.full_name || 'Unknown'}</span>
                            </span>
                            <span>{formatDate(escrow.initiated_at)}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${config.bg} ${config.color}`}>
                          <StatusIcon className="w-3 h-3" /> {config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="mx-5 mb-4 bg-gray-50 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-gray-200">
                      <div className="p-3 text-center">
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">KES {escrow.amount.toLocaleString()}</p>
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Fees</p>
                        <p className="text-sm font-bold text-red-600 mt-0.5">-KES {(escrow.service_fee + escrow.tax_amount).toLocaleString()}</p>
                      </div>
                      <div className="p-3 text-center">
                        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{isClient ? 'Freelancer Gets' : 'You Get'}</p>
                        <p className="text-sm font-bold text-green-600 mt-0.5">KES {netAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Fee Detail (expandable info) */}
                    <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-400">
                      <span>Service Fee (5%): KES {escrow.service_fee.toLocaleString()}</span>
                      <span className="hidden sm:inline">·</span>
                      <span>VAT (16%): KES {escrow.tax_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Timeline / Status Info */}
                  <div className="px-5 pb-4">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created {formatDate(escrow.initiated_at)} at {formatTime(escrow.initiated_at)}
                      </span>
                      {escrow.released_at && (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="w-3 h-3" />
                          Released {formatDate(escrow.released_at)}
                        </span>
                      )}
                      {escrow.job?.status && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          Job: {escrow.job.status}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {escrow.status === 'Held' && isClient && (
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleRelease(escrow.id)}
                          disabled={releasing === escrow.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          {releasing === escrow.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                          Release Funds
                        </button>
                        <button
                          onClick={() => handleRefund(escrow.id)}
                          disabled={releasing === escrow.id}
                          className="border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-600 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Refund
                        </button>
                      </div>
                    )}

                    {escrow.status === 'Held' && !isClient && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-medium bg-blue-50 rounded-lg p-2.5">
                          <Shield className="w-4 h-4 shrink-0" />
                          <span>Funds are securely held. They&apos;ll be released once the client approves your work.</span>
                        </div>
                      </div>
                    )}

                    {escrow.status === 'Released' && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-green-700 text-xs font-medium bg-green-50 rounded-lg p-2.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {isClient
                              ? `KES ${netAmount.toLocaleString()} released to ${escrow.freelancer?.full_name || 'freelancer'}`
                              : `KES ${netAmount.toLocaleString()} added to your wallet`}
                          </span>
                        </div>
                      </div>
                    )}

                    {escrow.status === 'Pending' && isClient && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-amber-700 text-xs font-medium bg-amber-50 rounded-lg p-2.5">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Awaiting payment. Fund this escrow to begin the project.</span>
                        </div>
                      </div>
                    )}

                    {escrow.status === 'Refunded' && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-gray-600 text-xs font-medium bg-gray-50 rounded-lg p-2.5">
                          <ArrowDownRight className="w-4 h-4 shrink-0" />
                          <span>Funds refunded to {isClient ? 'your wallet' : 'the client'}.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* How Escrow Works — only show when empty or always at bottom */}
        {escrows.length <= 2 && !loading && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              How Escrow Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '1', title: 'Client Funds Escrow', desc: 'When a proposal is accepted, the client deposits funds into a secure escrow account.' },
                { step: '2', title: 'Work is Completed', desc: 'The freelancer completes the job. Funds are held safely until both parties are satisfied.' },
                { step: '3', title: 'Payment Released', desc: 'Once the client approves the work, funds are released to the freelancer\'s wallet (minus 5% fee + VAT).' },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
