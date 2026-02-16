import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { recalculateHustleScore } from '@/lib/subscription-utils'
import { notifyEscrowReleased } from '@/lib/notifications'

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
  if (escrow.status !== 'Held') {
    return errorResponse('Escrow must be in Held status to release', 400)
  }

  const now = new Date().toISOString()

  // Update escrow status
  const { data: updated, error } = await auth.adminDb
    .from('escrow_transactions')
    .update({ status: 'Released', released_at: now })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to release escrow', 500)

  // Credit freelancer wallet
  const netAmount = escrow.amount - escrow.service_fee - escrow.tax_amount

  const { data: wallet } = await auth.adminDb
    .from('wallets')
    .select('*')
    .eq('user_id', escrow.freelancer_id)
    .single()

  if (wallet) {
    await auth.adminDb
      .from('wallets')
      .update({
        balance: wallet.balance + netAmount,
        total_earned: wallet.total_earned + netAmount,
        pending_balance: Math.max(0, wallet.pending_balance - escrow.amount),
      })
      .eq('id', wallet.id)

    // Record wallet transaction
    await auth.adminDb.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      amount: netAmount,
      type: 'Release',
      escrow_id: escrow.id,
      job_id: escrow.job_id,
      description: `Escrow release (fee: KES ${escrow.service_fee})`,
    })
  }

  // Update freelancer profile stats (jobs_completed + total_earned)
  const { data: fp } = await auth.adminDb
    .from('profiles')
    .select('total_earned, jobs_completed')
    .eq('id', escrow.freelancer_id)
    .single()

  if (fp) {
    await auth.adminDb
      .from('profiles')
      .update({
        total_earned: (fp.total_earned || 0) + netAmount,
        jobs_completed: (fp.jobs_completed || 0) + 1,
      })
      .eq('id', escrow.freelancer_id)
  }

  // Mark the job as Completed
  if (escrow.job_id) {
    await auth.adminDb
      .from('jobs')
      .update({ status: 'Completed' })
      .eq('id', escrow.job_id)
  }

  // Recalculate hustle score after stats update
  await recalculateHustleScore(auth.adminDb, escrow.freelancer_id, 'escrow_released')

  // Notify freelancer of payment (site + email + SMS)
  const { data: releasedJob } = await auth.adminDb.from('jobs').select('title').eq('id', escrow.job_id).single()
  notifyEscrowReleased(auth.adminDb, escrow.freelancer_id, netAmount, releasedJob?.title || 'a job').catch(console.error)

  return jsonResponse({ escrow: updated, net_amount: netAmount })
}
