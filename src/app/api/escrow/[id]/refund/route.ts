import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// POST /api/escrow/[id]/refund — Refund escrow to client (admin or dispute resolution)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: escrow } = await auth.supabase
    .from('escrow_transactions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!escrow) return errorResponse('Escrow transaction not found', 404)

  // Only admin, the client, or org owner/admin can refund
  const isAdmin = auth.profile.role === 'Admin'
  let isClient = escrow.client_id === auth.profile.id

  if (!isAdmin && !isClient && escrow.job_id) {
    const { data: job } = await auth.adminDb.from('jobs').select('organization_id').eq('id', escrow.job_id).single()
    if (job?.organization_id) {
      const { data: membership } = await auth.adminDb
        .from('organization_members')
        .select('role')
        .eq('organization_id', job.organization_id)
        .eq('user_id', auth.profile.id)
        .in('role', ['owner', 'admin'])
        .single()
      if (membership) isClient = true
    }
  }

  if (!isAdmin && !isClient) {
    return errorResponse('Only admin or the client can initiate a refund', 403)
  }

  if (escrow.status !== 'Held' && escrow.status !== 'Disputed') {
    return errorResponse('Escrow must be in Held or Disputed status to refund', 400)
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await auth.supabase
    .from('escrow_transactions')
    .update({ status: 'Refunded', refunded_at: now })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return errorResponse('Failed to refund escrow', 500)

  // Determine if this was an org-funded escrow
  let orgId: string | null = null
  if (escrow.job_id) {
    const { data: refundJob } = await auth.adminDb.from('jobs').select('organization_id').eq('id', escrow.job_id).single()
    orgId = refundJob?.organization_id || null
  }

  if (orgId) {
    // Refund to organization wallet
    const { data: orgWallet } = await auth.adminDb
      .from('organization_wallets')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (orgWallet) {
      await auth.adminDb
        .from('organization_wallets')
        .update({ balance: orgWallet.balance + escrow.amount })
        .eq('id', orgWallet.id)

      await auth.adminDb.from('organization_wallet_transactions').insert({
        wallet_id: orgWallet.id,
        amount: escrow.amount,
        type: 'Refund',
        escrow_id: escrow.id,
        job_id: escrow.job_id,
        performed_by: auth.profile.id,
        description: 'Escrow refund',
      })
    }
  } else {
    // Refund to personal wallet
    const { data: wallet } = await auth.adminDb
      .from('wallets')
      .select('*')
      .eq('user_id', escrow.client_id)
      .single()

    if (wallet) {
      await auth.adminDb
        .from('wallets')
        .update({
          balance: wallet.balance + escrow.amount,
          pending_balance: Math.max(0, wallet.pending_balance - escrow.amount),
        })
        .eq('id', wallet.id)

      await auth.adminDb.from('wallet_transactions').insert({
        wallet_id: wallet.id,
        amount: escrow.amount,
        type: 'Refund',
        escrow_id: escrow.id,
        job_id: escrow.job_id,
        description: 'Escrow refund',
      })
    }
  }

  return jsonResponse({ escrow: updated })
}
