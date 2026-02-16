import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { getUserPlan, calculateFees } from '@/lib/subscription-utils'
import { notifyProposalAccepted, notifyProposalRejected } from '@/lib/notifications'

// GET /api/proposals/[id] — Get single proposal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: proposal, error } = await auth.supabase
    .from('proposals')
    .select('*, job:jobs!job_id(id, title, budget_min, budget_max, status, client_id, organization_id), freelancer:profiles!freelancer_id(id, full_name, avatar_url, hustle_score, verification_status)')
    .eq('id', params.id)
    .single()

  if (error || !proposal) return errorResponse('Proposal not found', 404)

  // Only the freelancer who submitted or the job client can view
  const isOwner = proposal.freelancer_id === auth.profile.id
  let isJobClient = proposal.job?.client_id === auth.profile.id
  const isAdmin = auth.profile.role === 'Admin'

  // Allow org owner/admin to view proposals on org jobs
  if (!isOwner && !isJobClient && !isAdmin && proposal.job?.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', proposal.job.organization_id)
      .eq('user_id', auth.profile.id)
      .in('role', ['owner', 'admin'])
      .single()
    if (membership) isJobClient = true
  }

  if (!isOwner && !isJobClient && !isAdmin) {
    return errorResponse('You do not have permission to view this proposal', 403)
  }

  return jsonResponse({ proposal })
}

// PUT /api/proposals/[id] — Update proposal (freelancer: edit/withdraw, client: accept/reject)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const { data: proposal, error: propError } = await auth.adminDb
    .from('proposals')
    .select('*')
    .eq('id', params.id)
    .single()

  if (propError || !proposal) {
    console.error('Proposal fetch error:', propError)
    return errorResponse('Proposal not found', 404)
  }

  // Fetch the related job separately to avoid FK hint issues
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, organization_id')
    .eq('id', proposal.job_id)
    .single()

  if (!job) return errorResponse('Related job not found', 404)

  const isFreelancer = proposal.freelancer_id === auth.profile.id
  let isClient = job.client_id === auth.profile.id
  const isAdmin = auth.profile.role === 'Admin'

  // Allow org owner/admin to manage proposals on org jobs
  let isOrgManager = false
  if (!isClient && job.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .in('role', ['owner', 'admin'])
      .single()
    if (membership) {
      isOrgManager = true
      isClient = true // treat org manager as client for accept/reject flow
    }
  }

  // Freelancer actions: withdraw or edit cover letter
  if (isFreelancer) {
    const action = (body as Record<string, unknown>).action as string | undefined
    if (action === 'withdraw') {
      if (proposal.status !== 'Pending') {
        return errorResponse('Can only withdraw pending proposals', 400)
      }
      const { data: updated, error } = await auth.adminDb
        .from('proposals')
        .update({ status: 'Withdrawn' })
        .eq('id', params.id)
        .select()
        .single()
      if (error) return errorResponse('Failed to withdraw proposal', 500)
      return jsonResponse({ proposal: updated })
    }

    // Edit cover letter (only if still pending)
    if (proposal.status !== 'Pending') {
      return errorResponse('Can only edit pending proposals', 400)
    }
    const updateFields: Record<string, unknown> = {}
    const b = body as Record<string, unknown>
    if (typeof b.cover_letter === 'string' && b.cover_letter.length >= 50) {
      updateFields.cover_letter = b.cover_letter
    }
    if (typeof b.bid_amount === 'number' && b.bid_amount >= 100) {
      updateFields.bid_amount = b.bid_amount
    }
    if (Object.keys(updateFields).length === 0) {
      return errorResponse('No valid fields to update')
    }
    const { data: updated, error } = await auth.adminDb
      .from('proposals')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single()
    if (error) return errorResponse('Failed to update proposal', 500)
    return jsonResponse({ proposal: updated })
  }

  // Client actions: accept or reject
  if (isClient || isAdmin) {
    const action = (body as Record<string, unknown>).action as string | undefined

    if (action === 'accept') {
      if (proposal.status !== 'Pending') {
        return errorResponse('Can only accept pending proposals', 400)
      }

      const escrowAmount = proposal.bid_amount
      if (!escrowAmount || escrowAmount < 100) {
        return errorResponse('Proposal bid amount is invalid', 400)
      }

      // Check wallet balance — use org wallet for org jobs, personal wallet otherwise
      let wallet: { id: string; balance: number; user_id?: string; organization_id?: string } | null = null
      if (isOrgManager && job.organization_id) {
        let { data: orgWallet } = await auth.adminDb
          .from('organization_wallets')
          .select('*')
          .eq('organization_id', job.organization_id)
          .maybeSingle()
        // Auto-create org wallet if it doesn't exist
        if (!orgWallet) {
          const { data: newWallet } = await auth.adminDb
            .from('organization_wallets')
            .insert({ organization_id: job.organization_id })
            .select()
            .single()
          orgWallet = newWallet
        }
        wallet = orgWallet
        if (!wallet) {
          return errorResponse('Organization wallet not found. Please set up the org wallet first.', 400)
        }
      } else {
        const { data: userWallet } = await auth.adminDb
          .from('wallets')
          .select('*')
          .eq('user_id', auth.profile.id)
          .single()
        wallet = userWallet
        if (!wallet) {
          return errorResponse('Wallet not found. Please visit your wallet page first.', 400)
        }
      }

      if (wallet.balance < escrowAmount) {
        return errorResponse(
          `Insufficient wallet balance. You need KES ${escrowAmount.toLocaleString()} but only have KES ${wallet.balance.toLocaleString()}. Please top up ${isOrgManager ? 'the organization' : 'your'} wallet first.`,
          400
        )
      }

      // Accept this proposal (optionally assign a team member for org jobs)
      const assignedMemberId = (body as Record<string, unknown>).assigned_member_id as string | undefined
      const updateData: Record<string, unknown> = { status: 'Accepted', accepted_at: new Date().toISOString() }
      if (assignedMemberId && isOrgManager && job.organization_id) {
        updateData.assigned_member_id = assignedMemberId
      }
      let { data: updated, error } = await auth.adminDb
        .from('proposals')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()
      // If assigned_member_id column doesn't exist yet, retry without it
      if (error && updateData.assigned_member_id) {
        console.warn('assigned_member_id column not found, retrying without it')
        delete updateData.assigned_member_id
        const retry = await auth.adminDb
          .from('proposals')
          .update(updateData)
          .eq('id', params.id)
          .select()
          .single()
        updated = retry.data
        error = retry.error
      }
      if (error) {
        console.error('Accept proposal error:', error)
        return errorResponse('Failed to accept proposal', 500)
      }

      // Calculate service fee based on freelancer's plan (Pro: 4%, Free: 6%)
      const freelancerPlan = await getUserPlan(auth.adminDb, proposal.freelancer_id)
      const { serviceFee, taxAmount } = calculateFees(escrowAmount, freelancerPlan.service_fee_percent)

      // Deduct escrow amount from wallet
      const isOrgWallet = !!(isOrgManager && job.organization_id)
      const walletTable = isOrgWallet ? 'organization_wallets' : 'wallets'
      const { error: walletErr } = await auth.adminDb
        .from(walletTable)
        .update({ balance: wallet.balance - escrowAmount })
        .eq('id', wallet.id)

      if (walletErr) {
        console.error('Wallet deduction error:', walletErr)
        // Revert proposal acceptance
        await auth.adminDb.from('proposals').update({ status: 'Pending', accepted_at: null }).eq('id', params.id)
        return errorResponse('Failed to deduct from wallet', 500)
      }

      // Create escrow with Held status
      const { data: escrow, error: escrowErr } = await auth.adminDb
        .from('escrow_transactions')
        .insert({
          job_id: proposal.job_id,
          proposal_id: params.id,
          client_id: auth.profile.id,
          freelancer_id: proposal.freelancer_id,
          amount: escrowAmount,
          status: 'Held',
          transaction_type: 'Escrow',
          service_fee: serviceFee,
          tax_amount: taxAmount,
          description: `Escrow for job: ${proposal.job_id}`,
        })
        .select()
        .single()

      if (escrowErr) {
        console.error('Escrow creation error:', escrowErr)
        // Refund wallet
        await auth.adminDb.from(walletTable).update({ balance: wallet.balance }).eq('id', wallet.id)
        await auth.adminDb.from('proposals').update({ status: 'Pending', accepted_at: null }).eq('id', params.id)
        return errorResponse('Failed to create escrow. Wallet refunded.', 500)
      }

      // Record wallet transaction
      try {
        const txTable = isOrgWallet ? 'organization_wallet_transactions' : 'wallet_transactions'
        const txData: Record<string, unknown> = {
          wallet_id: wallet.id,
          amount: -escrowAmount,
          type: 'Escrow',
          escrow_id: escrow.id,
          job_id: proposal.job_id,
          description: `Escrow funded for job (KES ${escrowAmount.toLocaleString()})`,
        }
        if (isOrgWallet) txData.performed_by = auth.profile.id
        await auth.adminDb.from(txTable).insert(txData)
      } catch (e) { console.error('Wallet transaction record error:', e) }

      // Update job status to In-Progress
      const { error: jobErr } = await auth.adminDb
        .from('jobs')
        .update({ status: 'In-Progress' })
        .eq('id', proposal.job_id)
      if (jobErr) console.error('Update job status error:', jobErr)

      // Reject all other pending proposals for this job
      try {
        await auth.adminDb
          .from('proposals')
          .update({ status: 'Rejected', rejected_at: new Date().toISOString() })
          .eq('job_id', proposal.job_id)
          .eq('status', 'Pending')
          .neq('id', params.id)
      } catch (e) { console.error('Reject other proposals error:', e) }

      // Send a welcome message to the freelancer to start the conversation
      try {
        await auth.adminDb
          .from('messages')
          .insert({
            job_id: proposal.job_id,
            sender_id: auth.profile.id,
            receiver_id: proposal.freelancer_id,
            content: `Congratulations! Your proposal has been accepted and KES ${escrowAmount.toLocaleString()} has been secured in escrow. The job is now in progress. Let's discuss the details here.`,
          })
      } catch (e) { console.error('Send hire message error:', e) }

      // Notify freelancer they were hired (site + email + SMS)
      const jobTitle = (proposal as Record<string, unknown>).job_title as string || 'a job'
      notifyProposalAccepted(auth.adminDb, proposal.freelancer_id, jobTitle, proposal.job_id).catch(console.error)

      return jsonResponse({ proposal: updated, escrow, message: 'Freelancer hired and escrow funded!' })
    }

    if (action === 'reject') {
      if (proposal.status !== 'Pending') {
        return errorResponse('Can only reject pending proposals', 400)
      }
      const { data: updated, error } = await auth.adminDb
        .from('proposals')
        .update({ status: 'Rejected', rejected_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single()
      if (error) return errorResponse('Failed to reject proposal', 500)

      // Notify freelancer of rejection (site + email + SMS)
      const rejJobTitle = (proposal as Record<string, unknown>).job_title as string || 'a job'
      notifyProposalRejected(auth.adminDb, proposal.freelancer_id, rejJobTitle).catch(console.error)

      return jsonResponse({ proposal: updated })
    }

    return errorResponse('Invalid action. Use "accept" or "reject".', 400)
  }

  return errorResponse('You do not have permission to modify this proposal', 403)
}
