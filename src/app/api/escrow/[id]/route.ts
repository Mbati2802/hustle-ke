import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/escrow/[id] — Get single escrow transaction
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: escrow, error } = await auth.supabase
    .from('escrow_transactions')
    .select('*, job:jobs!job_id(id, title), client:profiles!client_id(id, full_name), freelancer:profiles!freelancer_id(id, full_name)')
    .eq('id', params.id)
    .single()

  if (error || !escrow) return errorResponse('Escrow transaction not found', 404)

  let isParty = escrow.client_id === auth.profile.id || escrow.freelancer_id === auth.profile.id
  if (!isParty && auth.profile.role !== 'Admin') {
    // Check org membership for org jobs
    if (escrow.job?.id) {
      const { data: job } = await auth.adminDb.from('jobs').select('organization_id').eq('id', escrow.job.id).single()
      if (job?.organization_id) {
        const { data: membership } = await auth.adminDb
          .from('organization_members')
          .select('role')
          .eq('organization_id', job.organization_id)
          .eq('user_id', auth.profile.id)
          .in('role', ['owner', 'admin'])
          .single()
        if (membership) isParty = true
      }
    }
  }
  if (!isParty && auth.profile.role !== 'Admin') {
    return errorResponse('You do not have permission to view this escrow', 403)
  }

  return jsonResponse({ escrow })
}
