import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, getPagination } from '@/lib/api-utils'

// GET /api/jobs/[id]/proposals — List proposals for a job (job owner or admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Verify job exists and user is the owner or org admin/owner
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, organization_id')
    .eq('id', params.id)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  let hasAccess = job.client_id === auth.profile.id || auth.profile.role === 'Admin'

  // Allow org owner/admin to view proposals on org jobs
  if (!hasAccess && job.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .in('role', ['owner', 'admin'])
      .single()
    if (membership) hasAccess = true
  }

  if (!hasAccess) {
    return errorResponse('Only the job owner can view proposals', 403)
  }

  const { limit, offset } = getPagination(req)
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = auth.adminDb
    .from('proposals')
    .select('*, freelancer:profiles!freelancer_id(id, full_name, avatar_url, title, hustle_score, verification_status, jobs_completed, hourly_rate)', { count: 'exact' })
    .eq('job_id', params.id)

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: proposals, error, count } = await query

  if (error) return errorResponse('Failed to fetch proposals', 500)

  // Enrich proposals with freelancer Pro status and sort Pro users first (priority matching)
  let enrichedProposals = proposals || []
  if (enrichedProposals.length > 0) {
    const freelancerIds = Array.from(new Set(enrichedProposals.map((p: { freelancer_id: string }) => p.freelancer_id)))
    const { data: subs } = await auth.adminDb
      .from('subscriptions')
      .select('user_id, plan')
      .in('user_id', freelancerIds)
      .eq('status', 'active')

    const proUsers = new Set((subs || []).filter((s: { plan: string }) => s.plan === 'pro' || s.plan === 'enterprise').map((s: { user_id: string }) => s.user_id))

    for (const p of enrichedProposals as Array<{ freelancer_id: string; freelancer: Record<string, unknown> }>) {
      if (p.freelancer) {
        p.freelancer.is_pro = proUsers.has(p.freelancer_id)
      }
    }

    // Priority job matching: sort Pro freelancers first, then by submission date
    enrichedProposals = enrichedProposals.sort((a: { freelancer_id: string; submitted_at: string }, b: { freelancer_id: string; submitted_at: string }) => {
      const aPro = proUsers.has(a.freelancer_id) ? 1 : 0
      const bPro = proUsers.has(b.freelancer_id) ? 1 : 0
      if (bPro !== aPro) return bPro - aPro // Pro first
      return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime() // Then newest
    })
  }

  return jsonResponse({
    proposals: enrichedProposals,
    pagination: { total: count || 0, limit, offset, hasMore: (count || 0) > offset + limit },
  })
}
