import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/api-utils'

async function getUserOrg(auth: any) {
  const { data: ownedOrg } = await auth.supabase
    .from('organizations')
    .select('id, name, created_at, custom_fee_percentage')
    .eq('owner_id', auth.profile.id)
    .eq('is_active', true)
    .single()
  if (ownedOrg) return ownedOrg

  const { data: membership } = await auth.supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, created_at, custom_fee_percentage)')
    .eq('user_id', auth.profile.id)
    .limit(1)
    .single()
  return membership?.organizations as any || null
}

// GET /api/enterprise/analytics — Team analytics dashboard data
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const org = await getUserOrg(auth)
    if (!org) return errorResponse('No organization found', 404)

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, all
    const now = new Date()
    let since: Date

    switch (period) {
      case '7d': since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break
      case '30d': since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break
      case '90d': since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break
      default: since = new Date(org.created_at); break
    }

    const sinceISO = since.toISOString()

    // Parallel queries — batch 1
    const [
      membersRes,
      jobsPostedRes,
      totalJobsRes,
      completedJobsRes,
      escrowRes,
      benchRes,
      activityRes,
    ] = await Promise.all([
      // Team members count
      auth.supabase
        .from('organization_members')
        .select('id, role', { count: 'exact' })
        .eq('organization_id', org.id),
      // Jobs posted by org in period
      auth.supabase
        .from('jobs')
        .select('id, title, status, budget_max, created_at, client_id')
        .eq('organization_id', org.id)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(50),
      // Total jobs ever
      auth.supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id),
      // Completed jobs
      auth.supabase
        .from('jobs')
        .select('id, budget_max, updated_at')
        .eq('organization_id', org.id)
        .eq('status', 'Completed')
        .gte('updated_at', sinceISO),
      // Escrow transactions
      auth.supabase
        .from('escrow_transactions')
        .select('id, amount, status, job_id, created_at')
        .eq('status', 'Released')
        .gte('created_at', sinceISO),
      // Bench size
      auth.supabase
        .from('organization_bench')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id),
      // Recent activity
      auth.supabase
        .from('organization_activity_log')
        .select('id, action, entity_type, details, created_at, user_id, profiles:user_id(full_name, avatar_url)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // Batch 2 — depends on jobsPostedRes
    const jobIds = (jobsPostedRes.data || []).map((j: any) => j.id)
    const proposalsRes = jobIds.length > 0
      ? await auth.supabase
          .from('proposals')
          .select('id, status, created_at, bid_amount')
          .in('job_id', jobIds)
      : { data: [] }

    const members = membersRes.data || []
    const jobsPosted = jobsPostedRes.data || []
    const completedJobs = completedJobsRes.data || []
    const escrowData = escrowRes.data || []

    // Calculate total spent
    const totalSpent = escrowData.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
    const avgProjectValue = completedJobs.length > 0
      ? completedJobs.reduce((sum: number, j: any) => sum + (j.budget_max || 0), 0) / completedJobs.length
      : 0

    // Role breakdown
    const roleBreakdown = members.reduce((acc: Record<string, number>, m: any) => {
      acc[m.role] = (acc[m.role] || 0) + 1
      return acc
    }, {})

    // Job status breakdown
    const jobStatusBreakdown = jobsPosted.reduce((acc: Record<string, number>, j: any) => {
      acc[j.status] = (acc[j.status] || 0) + 1
      return acc
    }, {})

    // Monthly spending trend (last 6 months)
    const monthlySpending: { month: string; amount: number; jobs: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthLabel = monthStart.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })
      const monthEscrows = escrowData.filter((e: any) => {
        const d = new Date(e.created_at)
        return d >= monthStart && d <= monthEnd
      })
      monthlySpending.push({
        month: monthLabel,
        amount: monthEscrows.reduce((s: number, e: any) => s + (e.amount || 0), 0),
        jobs: monthEscrows.length,
      })
    }

    return jsonResponse({
      overview: {
        total_members: membersRes.count || 0,
        total_jobs_posted: totalJobsRes.count || 0,
        jobs_in_period: jobsPosted.length,
        completed_in_period: completedJobs.length,
        total_spent: totalSpent,
        avg_project_value: Math.round(avgProjectValue),
        bench_size: benchRes.count || 0,
        proposals_received: proposalsRes.data?.length || 0,
      },
      role_breakdown: roleBreakdown,
      job_status_breakdown: jobStatusBreakdown,
      monthly_spending: monthlySpending,
      recent_jobs: jobsPosted.slice(0, 10),
      recent_activity: activityRes.data || [],
      fee_rate: org.custom_fee_percentage || 2,
      fee_savings: Math.round(totalSpent * 0.04), // savings vs 6% free plan (6% - 2% = 4%)
    })
  } catch (err) {
    console.error('[Enterprise Analytics GET]', err)
    return errorResponse('Failed to fetch analytics', 500)
  }
}
