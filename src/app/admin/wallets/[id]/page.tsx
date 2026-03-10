'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet, ArrowLeft, DollarSign, TrendingUp, TrendingDown,
  Clock, Plus, Minus, X, CheckCircle2, XCircle, Loader2
} from 'lucide-react'

interface WalletData {
  id: string
  user_id: string
  balance: number
  created_at: string
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    phone?: string
    avatar_url?: string
  }
}

interface Transaction {
  id: string
  type: string
  amount: number
  status: string
  description: string
  created_at: string
  metadata?: any
}

export default function WalletDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({ 
    total_deposits: 0, 
    total_withdrawals: 0, 
    total_escrow: 0, 
    total_credits: 0,
    total_debits: 0,
    transaction_count: 0,
    last_30_days: 0,
    avg_transaction: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustAction, setAdjustAction] = useState<'credit' | 'debit'>('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchWallet()
  }, [params.id])

  const fetchWallet = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/wallets/${params.id}`)
      const data = await res.json()
      setWallet(data.wallet)
      setTransactions(data.transactions || [])
      setStats(data.stats || { total_deposits: 0, total_withdrawals: 0, total_escrow: 0, transaction_count: 0 })
    } catch (err) {
      console.error('Failed to fetch wallet:', err)
    }
    setLoading(false)
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustAmount || !adjustReason) return

    setAdjusting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/wallets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: adjustAction,
          amount: parseFloat(adjustAmount),
          reason: adjustReason
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setShowAdjustModal(false)
        setAdjustAmount('')
        setAdjustReason('')
        fetchWallet()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to adjust wallet' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    }

    setAdjusting(false)
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Deposit': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'Withdrawal': return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'Escrow': return <DollarSign className="w-4 h-4 text-blue-500" />
      case 'Release': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'Refund': return <XCircle className="w-4 h-4 text-amber-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="bg-white rounded-xl border p-6 animate-pulse">
          <div className="h-48 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Wallet not found</p>
        <Link href="/admin/wallets" className="text-green-600 hover:underline mt-2 inline-block">
          Back to Wallets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/wallets" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-green-500" /> {wallet.profile.full_name}'s Wallet
            </h1>
            <p className="text-sm text-gray-500 mt-1">{wallet.profile.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setAdjustAction('credit'); setShowAdjustModal(true) }} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Credit
          </button>
          <button onClick={() => { setAdjustAction('debit'); setShowAdjustModal(true) }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <Minus className="w-4 h-4" /> Debit
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">KES {wallet.balance.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Deposits</p>
          <p className="text-2xl font-bold text-green-600 mt-1">KES {stats.total_deposits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Withdrawals</p>
          <p className="text-2xl font-bold text-red-600 mt-1">KES {stats.total_withdrawals.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.transaction_count}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Credits</p>
          <p className="text-xl font-bold text-blue-600 mt-1">KES {stats.total_credits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Debits</p>
          <p className="text-xl font-bold text-orange-600 mt-1">KES {stats.total_debits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Last 30 Days</p>
          <p className="text-xl font-bold text-purple-600 mt-1">KES {stats.last_30_days.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Avg Transaction</p>
          <p className="text-xl font-bold text-teal-600 mt-1">KES {Math.round(stats.avg_transaction).toLocaleString()}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">No transactions yet</div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getTransactionIcon(t.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.type}</p>
                      <p className="text-sm text-gray-500">{t.description || 'No description'}</p>
                      {t.metadata?.manual_adjustment && (
                        <p className="text-xs text-amber-600 mt-1">Manual adjustment by {t.metadata.admin_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${['Deposit', 'Release', 'Refund'].includes(t.type) ? 'text-green-600' : 'text-red-600'}`}>
                      {['Deposit', 'Release', 'Refund'].includes(t.type) ? '+' : '-'}KES {t.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdjustModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{adjustAction === 'credit' ? 'Credit' : 'Debit'} Wallet</h2>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  placeholder="Explain why you're adjusting this wallet..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={adjusting} className={`px-4 py-2 text-sm text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${adjustAction === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {adjusting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>{adjustAction === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />} {adjustAction === 'credit' ? 'Credit' : 'Debit'} Wallet</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
