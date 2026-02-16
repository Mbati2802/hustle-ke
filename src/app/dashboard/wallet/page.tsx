'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { cachedFetch } from '@/lib/fetch-cache'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  TrendingUp,
  Send,
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface WalletData {
  balance: number
}

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
  status: string
}

export default function WalletPage() {
  const router = useRouter()
  const { user, profile, orgMode, activeOrg } = useAuth()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawMsg, setWithdrawMsg] = useState('')
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [depositing, setDepositing] = useState(false)
  const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const hasMounted = useRef(false)

  // Redirect to enterprise wallet tab when in org mode
  useEffect(() => {
    if (orgMode && activeOrg) {
      router.replace('/dashboard/enterprise?tab=wallet')
    }
  }, [orgMode, activeOrg, router])

  useEffect(() => {
    if (!user) return
    if (!hasMounted.current) {
      hasMounted.current = true
      const cW = cachedFetch<{ wallet?: WalletData }>('/api/wallet', d => { if (d.wallet) setWallet(d.wallet) })
      const cT = cachedFetch<{ transactions?: Transaction[] }>('/api/wallet/transactions', d => { if (d.transactions) setTransactions(d.transactions); setLoading(false) })
      if (cW?.wallet) setWallet(cW.wallet)
      if (cT?.transactions) setTransactions(cT.transactions)
      if (cW || cT) setLoading(false)
    } else {
      Promise.all([
        fetch('/api/wallet').then(r => r.json()),
        fetch('/api/wallet/transactions').then(r => r.json()),
      ]).then(([walletData, txData]) => {
        if (walletData.wallet) setWallet(walletData.wallet)
        if (txData.transactions) setTransactions(txData.transactions)
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [user])

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawing) return
    setWithdrawing(true)
    setWithdrawMsg('')
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      })
      const data = await res.json()
      if (res.ok) {
        setWithdrawMsg('Withdrawal initiated successfully!')
        setWithdrawAmount('')
        // Refresh wallet
        const walletRes = await fetch('/api/wallet')
        const walletData = await walletRes.json()
        if (walletData.wallet) setWallet(walletData.wallet)
      } else {
        setWithdrawMsg(data.error || 'Withdrawal failed')
      }
    } catch {
      setWithdrawMsg('Network error')
    }
    setWithdrawing(false)
  }

  const handleDeposit = async () => {
    if (!depositAmount || !depositPhone || depositing) return
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < 10) {
      setDepositMsg({ type: 'error', text: 'Minimum deposit is KES 10' })
      return
    }
    if (amount > 150000) {
      setDepositMsg({ type: 'error', text: 'Maximum deposit is KES 150,000' })
      return
    }
    setDepositing(true)
    setDepositMsg(null)
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phone: depositPhone }),
      })
      const data = await res.json()
      if (res.ok) {
        setDepositMsg({ type: 'success', text: data.message })
        setDepositAmount('')
        // Refresh wallet balance
        const walletRes = await fetch('/api/wallet')
        const walletData = await walletRes.json()
        if (walletData.wallet) setWallet(walletData.wallet)
        // Refresh transactions
        const txRes = await fetch('/api/wallet/transactions')
        const txData = await txRes.json()
        if (txData.transactions) setTransactions(txData.transactions)
      } else {
        setDepositMsg({ type: 'error', text: data.error || 'Deposit failed' })
      }
    } catch {
      setDepositMsg({ type: 'error', text: 'Network error. Please try again.' })
    }
    setDepositing(false)
  }

  const balance = wallet?.balance ?? 0

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet & M-Pesa</h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
            <p className="text-green-100 text-sm mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{loading ? '...' : `KES ${balance.toLocaleString()}`}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setShowDeposit(!showDeposit); setShowWithdraw(false) }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Top Up
              </button>
              <button
                onClick={() => { setShowWithdraw(!showWithdraw); setShowDeposit(false) }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
            <p className="text-xs text-gray-400 mt-2">All time</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">M-Pesa Number</p>
            <p className="text-lg font-bold text-gray-900">{profile?.mpesa_phone || profile?.phone || 'Not set'}</p>
            <p className="text-xs text-gray-400 mt-2">For withdrawals</p>
          </div>
        </div>

        {/* Deposit Panel */}
        {showDeposit && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" /> Top Up via M-Pesa
            </h3>
            <p className="text-xs text-gray-500 mb-4">An STK push will be sent to your phone. Enter your M-Pesa PIN to complete.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Amount (KES)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  min="10"
                  max="150000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleDeposit}
              disabled={depositing || !depositAmount || !depositPhone}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2"
            >
              {depositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {depositing ? 'Sending STK Push...' : `Deposit KES ${depositAmount ? parseFloat(depositAmount).toLocaleString() : '0'}`}
            </button>
            {depositMsg && (
              <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg text-sm ${
                depositMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {depositMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{depositMsg.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Withdraw Panel */}
        {showWithdraw && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" /> Withdraw to M-Pesa
            </h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (KES)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <button onClick={handleWithdraw} disabled={withdrawing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Withdraw'}
              </button>
            </div>
            {withdrawMsg && <p className={`text-sm mt-2 ${withdrawMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{withdrawMsg}</p>}
            <p className="text-xs text-gray-500 mt-2">Funds will be sent to your registered M-Pesa number</p>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Transaction History</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-gray-300 mx-auto animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.type === 'Deposit' || tx.type === 'Release' ? 'bg-green-100' :
                      tx.type === 'Fee' ? 'bg-red-100' :
                      tx.type === 'Subscription' ? 'bg-amber-100' :
                      tx.type === 'Escrow' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {tx.type === 'Deposit' || tx.type === 'Release' ?
                        <ArrowDownLeft className="w-5 h-5 text-green-600" /> :
                        tx.type === 'Escrow' || tx.type === 'Subscription' ? <ArrowUpRight className="w-5 h-5 text-amber-600" /> :
                        <ArrowUpRight className={`w-5 h-5 ${tx.type === 'Fee' ? 'text-red-600' : 'text-blue-600'}`} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.type === 'Deposit' || tx.type === 'Release' || tx.type === 'Refund' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'Deposit' || tx.type === 'Release' || tx.type === 'Refund' ? '+' : '-'}KES {Math.abs(tx.amount)?.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'Completed' ? 'bg-green-50 text-green-600' :
                      tx.status === 'Failed' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
