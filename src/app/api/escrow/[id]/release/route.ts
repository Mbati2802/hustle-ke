import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { recalculateHustleScore } from '@/lib/subscription-utils'
import { notifyEscrowReleased } from '@/lib/notifications'
import { auditEscrowOperation } from '@/lib/audit-log'

// POST /api/escrow/[id]/release — Release escrow funds to freelancer (client only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: escrow } = await auth.adminDb
    .from('escrow_transactions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!escrow) return errorResponse('Escrow transaction not found', 404)

  let canRelease = escrow.client_id === auth.profile.id || auth.profile.role === 'Admin'
  if (!canRelease && escrow.job_id) {
    const { data: job } = await auth.adminDb.from('jobs').select('organization_id').eq('id', escrow.job_id).single()
    if (job?.organization_id) {
      const { data: membership } = await auth.adminDb
        .from('organization_members')
        .select('role')
        .eq('organization_id', job.organization_id)
        .eq('user_id', auth.profile.id)
        .in('role', ['owner', 'admin'])
        .single()
      if (membership) canRelease = true
    }
  }
  if (!canRelease) {
    return errorResponse('Only the client can release escrow funds', 403)
  }

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined

  // Use atomic transaction function to release escrow
  const { data: result, error } = await auth.adminDb.rpc('release_escrow_funds', {
    p_escrow_id: params.id,
  })

  if (error || !result?.success) {
    return errorResponse(result?.error || 'Failed to release escrow', 400)
  }

  // Audit escrow release
  await auditEscrowOperation(
    auth.adminDb,
    auth.userId,
    'escrow_release',
    escrow.amount,
    params.id,
    ipAddress,
    {
      net_amount: result.net_amount,
      service_fee: result.service_fee,
      tax_amount: result.tax_amount,
      freelancer_id: escrow.freelancer_id,
    }
  )

  // Recalculate hustle score after stats update
  await recalculateHustleScore(auth.adminDb, escrow.freelancer_id, 'escrow_released')

  // Notify freelancer of payment (site + email + SMS)
  const { data: releasedJob } = await auth.adminDb.from('jobs').select('title').eq('id', escrow.job_id).single()
  notifyEscrowReleased(auth.adminDb, escrow.freelancer_id, result.net_amount, releasedJob?.title || 'a job').catch(console.error)

  return jsonResponse({ 
    net_amount: result.net_amount,
    service_fee: result.service_fee,
    tax_amount: result.tax_amount,
  })
}
