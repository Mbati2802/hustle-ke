import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/stats — Dashboard statistics
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const supabase = auth.supabase

  // Parallel queries for all stats
  const [
    { count: totalUsers },
    { count: totalJobs },
    { count: openJobs },
    { count: totalProposals },
    { count: totalDisputes },
    { count: openDisputes },
    { count: totalEscrows },
    { data: revenueData },
    { data: recentUsers },
    { data: recentJobs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
    supabase.from('proposals').select('*', { count: 'exact', head: true }),
    supabase.from('disputes').select('*', { count: 'exact', head: true }),
    supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'Open'),
    supabase.from('escrow_transactions').select('*', { count: 'exact', head: true }),
    supabase.from('escrow_transactions').select('service_fee, tax_amount').eq('status', 'Released'),
    supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('jobs').select('id, title, status, created_at, budget_min, budget_max').order('created_at', { ascending: false }).limit(10),
  ])

  // Calculate total platform revenue from service fees
  let totalRevenue = 0
  let totalTax = 0
  if (revenueData) {
    for (const tx of revenueData) {
      totalRevenue += tx.service_fee || 0
      totalTax += tx.tax_amount || 0
    }
  }

  return jsonResponse({
    stats: {
      users: { total: totalUsers || 0 },
      jobs: { total: totalJobs || 0, open: openJobs || 0 },
      proposals: { total: totalProposals || 0 },
      disputes: { total: totalDisputes || 0, open: openDisputes || 0 },
      escrows: { total: totalEscrows || 0 },
      revenue: { service_fees: totalRevenue, tax_collected: totalTax, total: totalRevenue + totalTax },
    },
    recent_users: recentUsers || [],
    recent_jobs: recentJobs || [],
  })
}
