import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// POST /api/proposals/[id]/withdraw — Freelancer withdraws from an accepted job
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const proposalId = params.id

  // Get the proposal and verify it's accepted and belongs to the freelancer
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id, freelancer_id, job_id, status, bid_amount')
    .eq('id', proposalId)
    .single()

  if (!proposal) return errorResponse('Proposal not found', 404)
  if (proposal.status !== 'Accepted') return errorResponse('Only accepted proposals can be withdrawn', 400)
  if (proposal.freelancer_id !== auth.profile.id) return errorResponse('You can only withdraw your own proposals', 403)

  // Get the job details
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, title, client_id, status, organization_id')
    .eq('id', proposal.job_id)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Check if job can be withdrawn from
  const withdrawableStatuses = ['Open', 'In-Progress']
  if (!withdrawableStatuses.includes(job.status)) {
    return errorResponse(`Cannot withdraw from job with status "${job.status}"`, 400)
  }

  // Update proposal status to Withdrawn
  const { error: proposalError } = await auth.adminDb
    .from('proposals')
    .update({ 
      status: 'Withdrawn',
      updated_at: new Date().toISOString()
    })
    .eq('id', proposalId)

  if (proposalError) return errorResponse('Failed to withdraw proposal', 500)

  // Handle escrow refund if there's an active escrow
  const { data: escrow } = await auth.adminDb
    .from('escrow_transactions')
    .select('id, amount, status, wallet_id')
    .eq('job_id', job.id)
    .eq('status', 'Held')
    .single()

  if (escrow) {
    // Refund the escrow back to client's wallet
    const { error: refundError } = await auth.adminDb
      .from('wallet_transactions')
      .insert({
        wallet_id: escrow.wallet_id,
        type: 'Refund',
        amount: escrow.amount,
        description: `Refund for withdrawn proposal: ${job.title}`,
        metadata: {
          job_id: job.id,
          proposal_id: proposalId,
          escrow_id: escrow.id,
          refund_reason: 'Freelancer withdrew from job'
        }
      })

    if (refundError) {
      console.error('Failed to process refund:', refundError)
      // Don't fail the withdrawal, but log the error
    }

    // Update escrow status to Refunded
    await auth.adminDb
      .from('escrow_transactions')
      .update({ 
        status: 'Refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    // Update client wallet balance
    await auth.adminDb.rpc('increment_wallet_balance', {
      wallet_id: escrow.wallet_id,
      amount: escrow.amount
    })
  }

  // Update job status back to Open if no other accepted proposals
  const { data: otherProposals } = await auth.adminDb
    .from('proposals')
    .select('id')
    .eq('job_id', job.id)
    .eq('status', 'Accepted')

  if (!otherProposals || otherProposals.length === 0) {
    await auth.adminDb
      .from('jobs')
      .update({ 
        status: 'Open',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
  }

  // Send notifications
  const freelancerName = auth.profile.full_name || 'A freelancer'

  // Notify client
  await sendNotification(auth.adminDb, {
    userId: job.client_id,
    type: 'system',
    title: 'Freelancer Withdrew',
    message: `${freelancerName} withdrew from the job "${job.title}". The job is now open for other freelancers to apply.`,
    link: '/dashboard/projects',
  })

  // Notify organization members if it's an org job
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)

    if (members) {
      for (const mem of members) {
        if (mem.user_id !== job.client_id) {
          await sendNotification(auth.adminDb, {
            userId: mem.user_id,
            type: 'system',
            title: 'Freelancer Withdrew',
            message: `${freelancerName} withdrew from "${job.title}".`,
            link: '/dashboard/projects',
          })
        }
      }
    }
  }

  return jsonResponse({ 
    success: true, 
    message: 'Successfully withdrew from job' + (escrow ? ' and escrow refunded' : '')
  })
}
