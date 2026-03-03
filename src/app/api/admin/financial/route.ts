import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/financial — Financial summary for admin dashboard
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const period = url.searchParams.get('period') || 'all' // 'month', 'quarter', 'year', 'all'

  const now = new Date()
  let dateFilter = ''
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    dateFilter = start
  } else if (period === 'quarter') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3
    const start = new Date(now.getFullYear(), qMonth, 1).toISOString()
    dateFilter = start
  } else if (period === 'year') {
    const start = new Date(now.getFullYear(), 0, 1).toISOString()
    dateFilter = start
  }

  // Escrow summary
  let escrowQuery = auth.adminDb
    .from('escrow_transactions')
    .select('id, amount, service_fee, status, created_at, released_at')
  if (dateFilter) escrowQuery = escrowQuery.gte('created_at', dateFilter)
  const { data: escrows } = await escrowQuery

  const escrowStats = {
    total_volume: 0,
    total_fees: 0,
    total_released: 0,
    total_refunded: 0,
    total_held: 0,
    total_disputed: 0,
    transaction_count: escrows?.length || 0,
  }

  if (escrows) {
    for (const e of escrows) {
      escrowStats.total_volume += e.amount || 0
      escrowStats.total_fees += e.service_fee || 0
      if (e.status === 'Released') escrowStats.total_released += e.amount || 0
      if (e.status === 'Refunded') escrowStats.total_refunded += e.amount || 0
      if (e.status === 'Held') escrowStats.total_held += e.amount || 0
      if (e.status === 'Disputed') escrowStats.total_disputed += e.amount || 0
    }
  }

  // Wallet summary
  let walletQuery = auth.adminDb
    .from('wallet_transactions')
    .select('id, type, amount, status, created_at')
  if (dateFilter) walletQuery = walletQuery.gte('created_at', dateFilter)
  const { data: walletTxns } = await walletQuery

  const walletStats = {
    total_deposits: 0,
    total_withdrawals: 0,
    total_subscription_revenue: 0,
    deposit_count: 0,
    withdrawal_count: 0,
  }

  if (walletTxns) {
    for (const t of walletTxns) {
      if (t.type === 'Deposit' && t.status === 'Completed') {
        walletStats.total_deposits += t.amount || 0
        walletStats.deposit_count++
      }
      if (t.type === 'Withdrawal' && t.status === 'Completed') {
        walletStats.total_withdrawals += t.amount || 0
        walletStats.withdrawal_count++
      }
      if (t.type === 'Subscription' && t.status === 'Completed') {
        walletStats.total_subscription_revenue += t.amount || 0
      }
    }
  }

  // Monthly breakdown (last 12 months)
  const monthlyBreakdown: Array<{
    month: string
    escrow_volume: number
    fees_collected: number
    deposits: number
    withdrawals: number
    subscriptions: number
  }> = []

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = d.toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const monthLabel = d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })

    let ev = 0, fc = 0, dep = 0, wd = 0, sub = 0

    if (escrows) {
      for (const e of escrows) {
        if (e.created_at >= monthStart && e.created_at <= monthEnd) {
          ev += e.amount || 0
          fc += e.service_fee || 0
        }
      }
    }

    if (walletTxns) {
      for (const t of walletTxns) {
        if (t.created_at >= monthStart && t.created_at <= monthEnd && t.status === 'Completed') {
          if (t.type === 'Deposit') dep += t.amount || 0
          if (t.type === 'Withdrawal') wd += t.amount || 0
          if (t.type === 'Subscription') sub += t.amount || 0
        }
      }
    }

    monthlyBreakdown.push({
      month: monthLabel,
      escrow_volume: ev,
      fees_collected: fc,
      deposits: dep,
      withdrawals: wd,
      subscriptions: sub,
    })
  }

  // User counts
  const { count: totalUsers } = await auth.adminDb.from('profiles').select('id', { count: 'exact', head: true })
  const { count: activeSubscriptions } = await auth.adminDb
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  // Platform revenue = service fees + subscription revenue
  const platformRevenue = escrowStats.total_fees + walletStats.total_subscription_revenue

  return jsonResponse({
    period,
    escrow: escrowStats,
    wallet: walletStats,
    platform_revenue: platformRevenue,
    monthly_breakdown: monthlyBreakdown,
    total_users: totalUsers || 0,
    active_subscriptions: activeSubscriptions || 0,
  })
}
