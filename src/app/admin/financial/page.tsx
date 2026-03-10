'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Crown,
  Wallet,
  Shield,
  RefreshCw,
} from 'lucide-react'

interface FinancialData {
  period: string
  escrow: {
    total_volume: number
    total_fees: number
    total_released: number
    total_refunded: number
    total_held: number
    total_disputed: number
    transaction_count: number
  }
  wallet: {
    total_deposits: number
    total_withdrawals: number
    total_subscription_revenue: number
    deposit_count: number
    withdrawal_count: number
  }
  platform_revenue: number
  monthly_breakdown: Array<{
    month: string
    escrow_volume: number
    fees_collected: number
    deposits: number
    withdrawals: number
    subscriptions: number
  }>
  total_users: number
  active_subscriptions: number
}

function formatKES(amount: number) {
  return `KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function AdminFinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/financial?period=${period}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!data) return <p className="text-center text-gray-500 py-20">Failed to load financial data.</p>

  const maxVolume = Math.max(...data.monthly_breakdown.map(m => m.escrow_volume), 1)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-xs text-gray-500">Platform revenue, escrow, and wallet analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {['month', 'quarter', 'year', 'all'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 opacity-80" />
            <span className="text-xs font-medium opacity-80">Platform Revenue</span>
          </div>
          <p className="text-2xl font-bold">{formatKES(data.platform_revenue)}</p>
          <p className="text-xs opacity-70 mt-1">Fees + Subscriptions</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-medium text-gray-500">Escrow Volume</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatKES(data.escrow.total_volume)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.escrow.transaction_count} transactions</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Total Deposits</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatKES(data.wallet.total_deposits)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.wallet.deposit_count} deposits</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-medium text-gray-500">Active Subscribers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.active_subscriptions}</p>
          <p className="text-xs text-gray-400 mt-1">{formatKES(data.wallet.total_subscription_revenue)} revenue</p>
        </div>
      </div>

      {/* Escrow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Escrow Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Released', value: data.escrow.total_released, color: 'bg-green-500', textColor: 'text-green-600' },
              { label: 'Held', value: data.escrow.total_held, color: 'bg-amber-500', textColor: 'text-amber-600' },
              { label: 'Refunded', value: data.escrow.total_refunded, color: 'bg-blue-500', textColor: 'text-blue-600' },
              { label: 'Disputed', value: data.escrow.total_disputed, color: 'bg-red-500', textColor: 'text-red-600' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.textColor}`}>{formatKES(item.value)}</span>
              </div>
            ))}
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Service Fees Collected</span>
              <span className="text-sm font-bold text-green-600">{formatKES(data.escrow.total_fees)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Wallet Flow
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <ArrowDownLeft className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Money In (Deposits)</p>
                <p className="text-xs text-gray-500">{data.wallet.deposit_count} transactions</p>
              </div>
              <span className="text-sm font-bold text-green-600">{formatKES(data.wallet.total_deposits)}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Money Out (Withdrawals)</p>
                <p className="text-xs text-gray-500">{data.wallet.withdrawal_count} transactions</p>
              </div>
              <span className="text-sm font-bold text-red-600">{formatKES(data.wallet.total_withdrawals)}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
              <Crown className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Subscription Revenue</p>
                <p className="text-xs text-gray-500">{data.active_subscriptions} active</p>
              </div>
              <span className="text-sm font-bold text-purple-600">{formatKES(data.wallet.total_subscription_revenue)}</span>
            </div>
            <hr className="border-gray-100" />
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-gray-500 flex items-center gap-1"><Users className="w-4 h-4" /> Total Users</span>
              <span className="text-sm font-semibold text-gray-900">{data.total_users.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Monthly Escrow Volume (Last 12 Months)
        </h2>
        <div className="flex items-end gap-2 h-48">
          {data.monthly_breakdown.map((m, idx) => {
            const height = maxVolume > 0 ? (m.escrow_volume / maxVolume) * 100 : 0
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-400 font-medium">
                  {m.escrow_volume > 0 ? `${(m.escrow_volume / 1000).toFixed(0)}K` : '0'}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${m.month}: ${formatKES(m.escrow_volume)}`}
                />
                <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{m.month.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Monthly Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Month</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Escrow Vol.</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Fees</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Deposits</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Withdrawals</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Subscriptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.monthly_breakdown.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{m.month}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatKES(m.escrow_volume)}</td>
                  <td className="px-5 py-3 text-right text-green-600 font-medium">{formatKES(m.fees_collected)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatKES(m.deposits)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatKES(m.withdrawals)}</td>
                  <td className="px-5 py-3 text-right text-purple-600">{formatKES(m.subscriptions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
