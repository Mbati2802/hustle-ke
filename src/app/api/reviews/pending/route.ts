import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/reviews/pending — Get completed jobs that the current user hasn't reviewed yet
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const orgId = url.searchParams.get('organization_id')

  // Get completed jobs where user is the client (or org member)
  let jobIds: string[] = []

  if (orgId) {
    // Verify org membership
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', auth.profile.id)
      .single()
    if (!mem) return errorResponse('Not an organization member', 403)

    const { data: orgJobs } = await auth.adminDb
      .from('jobs')
      .select('id, title, updated_at')
      .eq('organization_id', orgId)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false })

    if (orgJobs) {
      // Check which ones the current user hasn't reviewed
      for (const job of orgJobs) {
        const { data: proposal } = await auth.adminDb
          .from('proposals')
          .select('freelancer_id')
          .eq('job_id', job.id)
          .eq('status', 'Accepted')
          .single()

        if (!proposal) continue

        const { data: review } = await auth.adminDb
          .from('reviews')
          .select('id')
          .eq('job_id', job.id)
          .eq('reviewer_id', auth.profile.id)
          .eq('reviewee_id', proposal.freelancer_id)
          .single()

        if (!review) {
          jobIds.push(job.id)
        }
      }

      const unreviewedJobs = orgJobs
        .filter(j => jobIds.includes(j.id))
        .map(j => ({ id: j.id, title: j.title, completed_at: j.updated_at }))

      return jsonResponse({ jobs: unreviewedJobs })
    }
  } else {
    // Personal mode — get completed jobs where user is client
    const { data: myJobs } = await auth.adminDb
      .from('jobs')
      .select('id, title, updated_at')
      .eq('client_id', auth.profile.id)
      .eq('status', 'Completed')
      .order('updated_at', { ascending: false })

    if (myJobs) {
      for (const job of myJobs) {
        const { data: proposal } = await auth.adminDb
          .from('proposals')
          .select('freelancer_id')
          .eq('job_id', job.id)
          .eq('status', 'Accepted')
          .single()

        if (!proposal) continue

        const { data: review } = await auth.adminDb
          .from('reviews')
          .select('id')
          .eq('job_id', job.id)
          .eq('reviewer_id', auth.profile.id)
          .eq('reviewee_id', proposal.freelancer_id)
          .single()

        if (!review) {
          jobIds.push(job.id)
        }
      }

      const unreviewedJobs = myJobs
        .filter(j => jobIds.includes(j.id))
        .map(j => ({ id: j.id, title: j.title, completed_at: j.updated_at }))

      return jsonResponse({ jobs: unreviewedJobs })
    }
  }

  return jsonResponse({ jobs: [] })
}
