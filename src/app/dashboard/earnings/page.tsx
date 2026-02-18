'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Briefcase,
  Loader2,
  BarChart3,
  PieChart,
  FileText,
  Filter,
  ChevronDown,
  Wallet,
  Receipt,
  Shield,
  Crown,
} from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  created_at: string
  job?: { id: string; title: string } | null
}

interface EarningsSummary {
  totalEarned: number
  totalFees: number
  totalWithdrawn: number
  netEarnings: number
  monthlyData: { month: string; earned: number; fees: number; net: number }[]
  byProject: { title: string; amount: number; jobId: string }[]
  transactionCount: number
}

const PERIODS = [
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '12m', label: '12 Months' },
  { key: 'all', label: 'All Time' },
]

export default function EarningsPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [exporting, setExporting] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [txRes, walletRes] = await Promise.all([
        fetch('/api/wallet/transactions?limit=500'),
        fetch('/api/wallet'),
      ])
      const txData = await txRes.json()
      const walletData = await walletRes.json()
      if (txData.transactions) setTransactions(txData.transactions)
      if (walletData.balance !== undefined) setWalletBalance(walletData.balance)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Filter transactions by period
  const getFilteredTransactions = (): Transaction[] => {
    const now = Date.now()
    let cutoff = 0
    switch (period) {
      case '7d': cutoff = now - 7 * 24 * 60 * 60 * 1000; break
      case '30d': cutoff = now - 30 * 24 * 60 * 60 * 1000; break
      case '90d': cutoff = now - 90 * 24 * 60 * 60 * 1000; break
      case '12m': cutoff = now - 365 * 24 * 60 * 60 * 1000; break
      default: cutoff = 0
    }
    return transactions.filter(tx => new Date(tx.created_at).getTime() >= cutoff)
  }

  const filteredTx = getFilteredTransactions()

  // Calculate summary
  const computeSummary = (): EarningsSummary => {
    let totalEarned = 0
    let totalFees = 0
    let totalWithdrawn = 0
    const projectMap = new Map<string, { title: string; amount: number; jobId: string }>()
    const monthMap = new Map<string, { earned: number; fees: number; net: number }>()

    filteredTx.forEach(tx => {
      const monthKey = new Date(tx.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, { earned: 0, fees: 0, net: 0 })
      const m = monthMap.get(monthKey)!

      if (tx.type === 'Escrow Release' || tx.type === 'Payment') {
        totalEarned += Math.abs(tx.amount)
        m.earned += Math.abs(tx.amount)
        m.net += Math.abs(tx.amount)
        if (tx.job) {
          const key = tx.job.id
          if (!projectMap.has(key)) projectMap.set(key, { title: tx.job.title || 'Unknown Project', amount: 0, jobId: tx.job.id })
          projectMap.get(key)!.amount += Math.abs(tx.amount)
        }
      } else if (tx.type === 'Service Fee' || tx.type === 'VAT') {
        totalFees += Math.abs(tx.amount)
        m.fees += Math.abs(tx.amount)
        m.net -= Math.abs(tx.amount)
      } else if (tx.type === 'Withdrawal') {
        totalWithdrawn += Math.abs(tx.amount)
      } else if (tx.type === 'Subscription') {
        totalFees += Math.abs(tx.amount)
        m.fees += Math.abs(tx.amount)
      }
    })

    const monthlyData = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .reverse()
      .slice(-12)

    const byProject = Array.from(projectMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    return {
      totalEarned,
      totalFees,
      totalWithdrawn,
      netEarnings: totalEarned - totalFees,
      monthlyData,
      byProject,
      transactionCount: filteredTx.length,
    }
  }

  const summary = computeSummary()

  // Export CSV
  const handleExportCSV = () => {
    setExporting(true)
    try {
      const headers = ['Date', 'Type', 'Description', 'Amount (KES)', 'Project', 'Status']
      const rows = filteredTx.map(tx => [
        new Date(tx.created_at).toLocaleDateString('en-KE'),
        tx.type,
        tx.description || '',
        tx.amount.toString(),
        tx.job?.title || '',
        tx.status || '',
      ])
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hustleke-earnings-${period}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // Simple bar chart renderer (max height 120px)
  const maxEarned = Math.max(...summary.monthlyData.map(d => d.earned), 1)

  if (loading) {
    return (
      <div className="p-4 lg:p-6 xl:p-8 animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-64 bg-gray-100 rounded mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
              <div className="h-6 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-48" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Earnings & Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile?.role === 'Freelancer' ? 'Track your freelance income' : 'Track project spending'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={exporting || filteredTx.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">KES {summary.totalEarned.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Earned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">KES {summary.totalFees.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Fees & Deductions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-600">KES {summary.netEarnings.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Net Earnings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">KES {walletBalance.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current Balance</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" /> Monthly Earnings
            </h3>
            <span className="text-xs text-gray-400">{summary.monthlyData.length} month(s)</span>
          </div>
          {summary.monthlyData.length > 0 ? (
            <div className="flex items-end gap-1 sm:gap-2 h-32 overflow-x-auto scrollbar-hide">
              {summary.monthlyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[40px] sm:min-w-[50px] flex-1">
                  <span className="text-[9px] sm:text-[10px] font-semibold text-green-600">
                    {d.earned > 0 ? `${(d.earned / 1000).toFixed(0)}K` : ''}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md min-h-[4px] transition-all"
                    style={{ height: `${Math.max(4, (d.earned / maxEarned) * 100)}px` }}
                  />
                  <span className="text-[8px] sm:text-[9px] text-gray-400 truncate w-full text-center">{d.month.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-400">No earnings data for this period</p>
            </div>
          )}
        </div>

        {/* Earnings by Project */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-blue-600" /> Top Projects
          </h3>
          {summary.byProject.length > 0 ? (
            <div className="space-y-3">
              {summary.byProject.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(p.amount / (summary.byProject[0]?.amount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">
                    KES {p.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Briefcase className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No project data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Service Fee</p>
              <p className="text-[10px] text-gray-500 uppercase">Platform commission</p>
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">
            KES {filteredTx.filter(t => t.type === 'Service Fee').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">VAT (16%)</p>
              <p className="text-[10px] text-gray-500 uppercase">Government tax</p>
            </div>
          </div>
          <p className="text-xl font-bold text-amber-700">
            KES {filteredTx.filter(t => t.type === 'VAT').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Subscriptions</p>
              <p className="text-[10px] text-gray-500 uppercase">Pro plan charges</p>
            </div>
          </div>
          <p className="text-xl font-bold text-purple-700">
            KES {filteredTx.filter(t => t.type === 'Subscription').reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
          <span className="text-xs text-gray-400">{filteredTx.length} transactions</span>
        </div>
        {filteredTx.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredTx.slice(0, 50).map(tx => {
              const isCredit = tx.amount > 0
              return (
                <div key={tx.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isCredit ? <ArrowDownLeft className="w-4 h-4 text-green-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{tx.type}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.description || tx.job?.title || tx.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'}KES {Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
            {filteredTx.length > 50 && (
              <div className="px-5 py-3 text-center">
                <p className="text-xs text-gray-400">Showing 50 of {filteredTx.length} transactions. Export CSV for full data.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No transactions in this period</p>
          </div>
        )}
      </div>
    </div>
  )
}
