import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { sendNotification } from '@/lib/notifications'

// POST /api/jobs/[id]/cancel — Cancel a job and refund escrow
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const jobId = params.id

  // Verify the job exists and is in a cancellable state
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, title, organization_id')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Check if job can be cancelled
  const cancellableStatuses = ['Open', 'In-Progress', 'Review']
  if (!cancellableStatuses.includes(job.status)) {
    return errorResponse(`Job with status "${job.status}" cannot be cancelled`, 400)
  }

  // Verify the requester is the client (or org member)
  let isClient = job.client_id === auth.profile.id
  if (!isClient && job.organization_id) {
    const { data: mem } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .single()
    if (mem) isClient = true
  }

  if (!isClient && auth.profile.role !== 'Admin') {
    return errorResponse('Only the client can cancel this job', 403)
  }

  // Get the accepted proposal to find the freelancer
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('freelancer_id')
    .eq('job_id', jobId)
    .eq('status', 'Accepted')
    .single()

  let freelancerId = proposal?.freelancer_id

  // Update job status to Cancelled
  const { error: jobError } = await auth.adminDb
    .from('jobs')
    .update({ 
      status: 'Cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)

  if (jobError) return errorResponse('Failed to cancel job', 500)

  // Handle escrow refund if there's an active escrow
  const { data: escrow } = await auth.adminDb
    .from('escrow')
    .select('id, amount, status, wallet_id')
    .eq('job_id', jobId)
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
        description: `Refund for cancelled job: ${job.title}`,
        metadata: {
          job_id: jobId,
          escrow_id: escrow.id,
          refund_reason: 'Job cancelled by client'
        }
      })

    if (refundError) {
      console.error('Failed to process refund:', refundError)
      // Don't fail the cancellation, but log the error
    }

    // Update escrow status to Refunded
    await auth.adminDb
      .from('escrow')
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

  // Send notifications
  const clientName = auth.profile.full_name || 'A client'

  // Notify freelancer if there is one
  if (freelancerId) {
    await sendNotification(auth.adminDb, {
      userId: freelancerId,
      type: 'system',
      title: 'Job Cancelled',
      message: `${clientName} cancelled the job "${job.title}". Any escrow funds have been refunded to the client.`,
      link: '/dashboard/jobs',
    })
  }

  // Notify organization members if it's an org job
  if (job.organization_id) {
    const { data: members } = await auth.adminDb
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', job.organization_id)

    if (members) {
      for (const mem of members) {
        if (mem.user_id !== auth.profile.id) {
          await sendNotification(auth.adminDb, {
            userId: mem.user_id,
            type: 'system',
            title: 'Job Cancelled',
            message: `${clientName} cancelled the job "${job.title}".`,
            link: '/dashboard/projects',
          })
        }
      }
    }
  }

  return jsonResponse({ 
    success: true, 
    message: 'Job cancelled successfully' + (escrow ? ' and escrow refunded' : '')
  })
}
