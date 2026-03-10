import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse } from '@/lib/api-utils'

// GET /api/admin/stats — Dashboard statistics with chart data
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const supabase = auth.supabase

  // Date ranges
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel queries for all stats
  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: openJobs },
    { count: inProgressJobs },
    { count: completedJobs },
    { count: disputedJobs },
    { count: cancelledJobs },
    { count: totalProposals },
    { count: totalDisputes },
    { count: openDisputes },
    { count: resolvedDisputes },
    { count: totalEscrows },
    { data: revenueData },
    { data: recentUsers },
    { data: recentJobs },
    { data: newUsers30d },
    { data: newJobs30d },
    { data: newProposals30d },
    { data: escrowData30d },
    { count: proSubscriptions },
    { count: activeFreelancers },
    { count: activeClients },
    { count: adminUsers },
    { count: verifiedUsers },
    { data: openDisputeEscrows },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'In-Progress'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Disputed'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Cancelled'),
    supabase.from('proposals').select('*', { count: 'exact', head: true }),
    supabase.from('disputes').select('*', { count: 'exact', head: true }),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'Resolved'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }),
    supabase.from('escrow_transactions').select('service_fee, tax_amount, initiated_at, amount').eq('status', 'Released'),
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('jobs').select('id, title, status, created_at, budget_min, budget_max').order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('jobs').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('proposals').select('id, created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('escrow_transactions').select('id, amount, initiated_at, status').gte('initiated_at', thirtyDaysAgo),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Freelancer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Client'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'Admin'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('verification_status', 'Unverified'),
    supabase.from('escrow_transactions').select('amount').eq('status', 'Disputed'),
  ])

  // Calculate total platform revenue
  let totalRevenue = 0
  let totalTax = 0
  if (revenueData) {
    for (const tx of revenueData) {
      totalRevenue += tx.service_fee || 0
      totalTax += tx.tax_amount || 0
    }
  }

  // Build daily time-series for the last 30 days
  const days: Record<string, { date: string; users: number; jobs: number; proposals: number; revenue: number; escrow_volume: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    days[key] = { date: key, users: 0, jobs: 0, proposals: 0, revenue: 0, escrow_volume: 0 }
  }

  // Aggregate time-series data
  for (const u of (newUsers30d || [])) {
    const key = u.created_at?.split('T')[0]
    if (key && days[key]) days[key].users++
  }
  for (const j of (newJobs30d || [])) {
    const key = j.created_at?.split('T')[0]
    if (key && days[key]) days[key].jobs++
  }
  for (const p of (newProposals30d || [])) {
    const key = p.created_at?.split('T')[0]
    if (key && days[key]) days[key].proposals++
  }
  for (const e of (escrowData30d || [])) {
    const key = e.initiated_at?.split('T')[0]
    if (key && days[key]) days[key].escrow_volume += e.amount || 0
  }
  for (const r of (revenueData || [])) {
    const key = r.initiated_at?.split('T')[0]
    if (key && days[key]) days[key].revenue += (r.service_fee || 0) + (r.tax_amount || 0)
  }

  const chartData = Object.values(days)

  // Weekly aggregates for bar chart (last 7 days)
  const weeklyData = chartData.slice(-7).map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
  }))

  // Escrow status breakdown for pie chart
  const [
    { count: heldCount },
    { count: releasedCount },
    { count: refundedCount },
    { count: disputedCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).eq('status', 'Held'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).eq('status', 'Released'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).eq('status', 'Refunded'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).eq('status', 'Disputed'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
  ])

  const escrowBreakdown = [
    { name: 'Held', value: heldCount || 0, color: '#3B82F6' },
    { name: 'Released', value: releasedCount || 0, color: '#22C55E' },
    { name: 'Refunded', value: refundedCount || 0, color: '#94A3B8' },
    { name: 'Disputed', value: disputedCount || 0, color: '#EF4444' },
    { name: 'Pending', value: pendingCount || 0, color: '#F59E0B' },
  ]

  // User role breakdown
  const userBreakdown = [
    { name: 'Freelancers', value: activeFreelancers || 0, color: '#8B5CF6' },
    { name: 'Clients', value: activeClients || 0, color: '#06B6D4' },
    { name: 'Pro Members', value: proSubscriptions || 0, color: '#F59E0B' },
  ]

  const escrowAtRisk = (openDisputeEscrows || []).reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0)

  return jsonResponse({
    stats: {
      users: { total: totalUsers || 0, freelancers: activeFreelancers || 0, clients: activeClients || 0, admins: adminUsers || 0, verified: verifiedUsers || 0 },
      jobs: { total: totalJobs || 0, open: openJobs || 0, in_progress: inProgressJobs || 0, completed: completedJobs || 0, disputed: disputedJobs || 0, cancelled: cancelledJobs || 0 },
      proposals: { total: totalProposals || 0 },
      disputes: { total: totalDisputes || 0, open: openDisputes || 0, resolved: resolvedDisputes || 0, escrow_at_risk: escrowAtRisk },
      escrows: { total: totalEscrows || 0 },
      revenue: { service_fees: totalRevenue, tax_collected: totalTax, total: totalRevenue + totalTax },
      subscriptions: { pro: proSubscriptions || 0 },
    },
    recent_users: recentUsers || [],
    recent_jobs: recentJobs || [],
    chart_data: chartData,
    weekly_data: weeklyData,
    escrow_breakdown: escrowBreakdown,
    user_breakdown: userBreakdown,
  })
}
