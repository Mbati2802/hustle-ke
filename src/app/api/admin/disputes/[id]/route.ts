import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/disputes/[id] — Get dispute details (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: dispute, error } = await auth.supabase
    .from('disputes')
    .select('*, job:jobs!job_id(id, title, status, description), initiator:profiles!initiator_id(id, full_name, email, avatar_url), respondent:profiles!respondent_id(id, full_name, email, avatar_url), escrow:escrow_transactions!escrow_id(*)')
    .eq('id', params.id)
    .single()

  if (error || !dispute) return errorResponse('Dispute not found', 404)

  // Fetch messages related to the job for context
  const { data: messages } = await auth.supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(id, full_name)')
    .eq('job_id', dispute.job_id)
    .order('created_at', { ascending: true })
    .limit(50)

  return jsonResponse({ dispute, messages: messages || [] })
}

// PUT /api/admin/disputes/[id] — Resolve a dispute (admin)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    resolution: string
    action: 'release_to_freelancer' | 'refund_to_client' | 'split'
    split_freelancer_pct?: number
  }>(req)

  if (!body) return errorResponse('Invalid request body')
  if (!body.resolution || !body.action) {
    return errorResponse('resolution and action are required')
  }
  if (body.resolution.length < 10) return errorResponse('Resolution must be at least 10 characters')

  const { data: dispute } = await auth.supabase
    .from('disputes')
    .select('*, escrow:escrow_transactions!escrow_id(*)')
    .eq('id', params.id)
    .single()

  if (!dispute) return errorResponse('Dispute not found', 404)
  if (dispute.status !== 'Open') return errorResponse('Dispute is already resolved', 400)

  const escrow = dispute.escrow
  if (!escrow) return errorResponse('No escrow associated with this dispute', 400)

  const now = new Date().toISOString()
  let refundAmount = 0
  let releaseAmount = 0

  switch (body.action) {
    case 'release_to_freelancer':
      releaseAmount = escrow.amount
      break
    case 'refund_to_client':
      refundAmount = escrow.amount
      break
    case 'split': {
      const pct = Math.min(100, Math.max(0, body.split_freelancer_pct || 50))
      releaseAmount = Math.round(escrow.amount * (pct / 100))
      refundAmount = escrow.amount - releaseAmount
      break
    }
    default:
      return errorResponse('Invalid action')
  }

  // Update dispute
  const { data: updated, error: disputeError } = await auth.supabase
    .from('disputes')
    .update({
      status: 'Resolved',
      resolution: body.resolution,
      resolved_by: auth.profile.id,
      resolved_at: now,
      refund_amount: refundAmount,
      release_amount: releaseAmount,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (disputeError) return errorResponse('Failed to resolve dispute', 500)

  // Process financial resolution
  if (releaseAmount > 0) {
    const netAmount = releaseAmount - escrow.service_fee - escrow.tax_amount
    const { data: fWallet } = await auth.supabase
      .from('wallets')
      .select('*')
      .eq('user_id', escrow.freelancer_id)
      .single()

    if (fWallet) {
      await auth.supabase.from('wallets').update({
        balance: fWallet.balance + Math.max(0, netAmount),
        pending_balance: Math.max(0, fWallet.pending_balance - escrow.amount),
        total_earned: fWallet.total_earned + Math.max(0, netAmount),
      }).eq('id', fWallet.id)

      await auth.supabase.from('wallet_transactions').insert({
        wallet_id: fWallet.id,
        amount: Math.max(0, netAmount),
        type: 'Release',
        escrow_id: escrow.id,
        job_id: dispute.job_id,
        description: `Dispute resolution: released KES ${releaseAmount} (fee: KES ${escrow.service_fee})`,
      })
    }
  }

  if (refundAmount > 0) {
    const { data: cWallet } = await auth.supabase
      .from('wallets')
      .select('*')
      .eq('user_id', escrow.client_id)
      .single()

    if (cWallet) {
      await auth.supabase.from('wallets').update({
        balance: cWallet.balance + refundAmount,
        pending_balance: Math.max(0, cWallet.pending_balance - escrow.amount),
      }).eq('id', cWallet.id)

      await auth.supabase.from('wallet_transactions').insert({
        wallet_id: cWallet.id,
        amount: refundAmount,
        type: 'Refund',
        escrow_id: escrow.id,
        job_id: dispute.job_id,
        description: `Dispute resolution: refunded KES ${refundAmount}`,
      })
    }
  }

  // Update escrow status
  const escrowStatus = refundAmount > 0 && releaseAmount > 0 ? 'Released' : refundAmount > 0 ? 'Refunded' : 'Released'
  await auth.supabase
    .from('escrow_transactions')
    .update({ status: escrowStatus, released_at: releaseAmount > 0 ? now : null, refunded_at: refundAmount > 0 ? now : null })
    .eq('id', escrow.id)

  return jsonResponse({ dispute: updated, release_amount: releaseAmount, refund_amount: refundAmount })
}
