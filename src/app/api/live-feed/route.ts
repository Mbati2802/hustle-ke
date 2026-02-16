import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// Event types for the live feed
type FeedEventType = 'job_posted' | 'freelancer_hired' | 'payment_made' | 'job_completed' | 'new_member' | 'proposal_sent' | 'milestone'

interface FeedEvent {
  id: string
  type: FeedEventType
  message: string
  detail: string
  icon: string
  color: string
  timestamp: string
  amount?: number
}

// GET /api/live-feed — Real-time platform activity feed
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const events: FeedEvent[] = []

  try {
    // Parallel queries for speed — feed events (limited) + accurate count stats
    const [
      recentJobsRes,
      recentProposalsRes,
      recentCompletedRes,
      recentSignupsRes,
      escrowRes,
      totalStatsRes,
      // Accurate COUNT queries for stats
      openJobsCountRes,
      completedJobsCountRes,
      newMembersCountRes,
      totalMembersCountRes,
    ] = await Promise.all([
      // Recent open jobs (last 48h) — for feed events
      supabase!
        .from('jobs')
        .select('id, title, budget_max, skills_required, created_at, client:profiles!client_id(full_name)')
        .eq('status', 'Open')
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10),
      // Recent proposals (last 24h) — for feed events
      supabase!
        .from('proposals')
        .select('id, created_at, job:jobs!job_id(title), freelancer:profiles!freelancer_id(full_name)')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(8),
      // Recently completed jobs — for feed events
      supabase!
        .from('jobs')
        .select('id, title, budget_max, updated_at')
        .eq('status', 'Completed')
        .order('updated_at', { ascending: false })
        .limit(8),
      // Recent signups (last 7 days) — for feed events
      supabase!
        .from('profiles')
        .select('id, full_name, role, title, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(8),
      // Recent escrow releases (payments) — for feed events
      supabase!
        .from('escrow_transactions')
        .select('id, amount, status, updated_at')
        .eq('status', 'Released')
        .order('updated_at', { ascending: false })
        .limit(8),
      // Total paid out — sum all released escrows
      supabase!
        .from('escrow_transactions')
        .select('amount')
        .eq('status', 'Released'),
      // Accurate count: all open jobs
      supabase!
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Open'),
      // Accurate count: all completed jobs
      supabase!
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed'),
      // Accurate count: new members this week
      supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // Accurate count: total members
      supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true }),
    ])

    const recentJobs = recentJobsRes.data || []
    const recentProposals = recentProposalsRes.data || []
    const completedJobs = recentCompletedRes.data || []
    const newMembers = recentSignupsRes.data || []
    const payments = escrowRes.data || []
    const allReleased = totalStatsRes.data || []

    // --- Build feed events ---

    // Job posted events
    recentJobs.forEach((job: any) => {
      const firstName = anonymizeName(job.client?.full_name)
      const skill = job.skills_required?.[0] || ''
      events.push({
        id: `job-${job.id}`,
        type: 'job_posted',
        message: `${firstName} posted a new job`,
        detail: truncate(job.title, 50) + (job.budget_max ? ` — KES ${job.budget_max.toLocaleString()}` : ''),
        icon: 'Briefcase',
        color: 'green',
        timestamp: job.created_at,
        amount: job.budget_max,
      })
    })

    // Proposal sent events
    recentProposals.forEach((p: any) => {
      const firstName = anonymizeName(p.freelancer?.full_name)
      events.push({
        id: `proposal-${p.id}`,
        type: 'proposal_sent',
        message: `${firstName} submitted a proposal`,
        detail: truncate(p.job?.title || 'a project', 50),
        icon: 'Send',
        color: 'blue',
        timestamp: p.created_at,
      })
    })

    // Job completed events
    completedJobs.forEach((job: any) => {
      events.push({
        id: `completed-${job.id}`,
        type: 'job_completed',
        message: 'A project was completed',
        detail: truncate(job.title, 50) + (job.budget_max ? ` — KES ${job.budget_max.toLocaleString()} earned` : ''),
        icon: 'CheckCircle',
        color: 'green',
        timestamp: job.updated_at,
        amount: job.budget_max,
      })
    })

    // Payment events
    payments.forEach((p: any) => {
      events.push({
        id: `payment-${p.id}`,
        type: 'payment_made',
        message: `KES ${p.amount.toLocaleString()} paid to freelancer`,
        detail: 'Instant M-Pesa payout',
        icon: 'DollarSign',
        color: 'amber',
        timestamp: p.updated_at,
        amount: p.amount,
      })
    })

    // New member events
    newMembers.forEach((m: any) => {
      const firstName = anonymizeName(m.full_name)
      const roleLabel = m.role === 'Client' ? 'client' : 'freelancer'
      events.push({
        id: `member-${m.id}`,
        type: 'new_member',
        message: `${firstName} joined as a ${roleLabel}`,
        detail: m.title || (m.role === 'Client' ? 'Ready to hire talent' : 'Looking for opportunities'),
        icon: 'UserPlus',
        color: 'purple',
        timestamp: m.created_at,
      })
    })

    // Calculate live stats from accurate COUNT queries
    const totalPaidOut = allReleased.reduce((s: number, e: any) => s + (e.amount || 0), 0)
    const openJobsCount = openJobsCountRes.count ?? 0
    const completedJobsCount = completedJobsCountRes.count ?? 0
    const newMembersCount = newMembersCountRes.count ?? 0
    const totalMembersCount = totalMembersCountRes.count ?? 0

    // Sort all events by timestamp (newest first), then shuffle a bit for variety
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Take top 15 most recent and shuffle them slightly for a more dynamic feel
    const top = events.slice(0, 15)
    for (let i = top.length - 1; i > 0; i--) {
      // Only shuffle within ±2 positions for a natural feel
      const j = Math.max(0, i - Math.floor(Math.random() * 3))
      ;[top[i], top[j]] = [top[j], top[i]]
    }

    return jsonResponse({
      events: top,
      stats: {
        total_paid_out: totalPaidOut,
        active_jobs: openJobsCount,
        total_completed: completedJobsCount,
        new_members_this_week: newMembersCount,
        total_members: totalMembersCount,
      },
    })
  } catch (error) {
    console.error('[Live Feed] Error:', error)
    return errorResponse('Failed to fetch live feed', 500)
  }
}

// Show only first name + last initial for privacy
function anonymizeName(fullName: string | null): string {
  if (!fullName) return 'Someone'
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '...'
}
