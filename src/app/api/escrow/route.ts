import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { getUserPlan, calculateFees } from '@/lib/subscription-utils'
import { withIdempotency } from '@/lib/idempotency'
import { auditEscrowOperation } from '@/lib/audit-log'

// POST /api/escrow — Create escrow for an accepted proposal (atomic transaction)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined

  // Use idempotency to prevent duplicate escrow creation
  return withIdempotency(req, auth.adminDb, auth.userId, async () => {
    const body = await parseBody<{ proposal_id: string; amount: number }>(req)
    if (!body || !body.proposal_id || !body.amount) {
      return { status: 400, body: { error: 'proposal_id and amount are required' } }
    }

    if (body.amount < 100) {
      return { status: 400, body: { error: 'Minimum escrow amount is KES 100' } }
    }

    // Verify proposal exists and is accepted
    const { data: proposal } = await auth.adminDb
      .from('proposals')
      .select('*, job:jobs!job_id(id, client_id, status)')
      .eq('id', body.proposal_id)
      .single()

    if (!proposal) {
      return { status: 404, body: { error: 'Proposal not found' } }
    }
    if (proposal.status !== 'Accepted') {
      return { status: 400, body: { error: 'Proposal must be accepted first' } }
    }
    if (proposal.job?.client_id !== auth.profile.id && auth.profile.role !== 'Admin') {
      return { status: 403, body: { error: 'Only the job client can fund escrow' } }
    }

    // Check for existing active escrow on this proposal
    const { data: existingEscrow } = await auth.adminDb
      .from('escrow_transactions')
      .select('id')
      .eq('proposal_id', body.proposal_id)
      .in('status', ['Pending', 'Held'])
      .single()

    if (existingEscrow) {
      return { status: 409, body: { error: 'An active escrow already exists for this proposal' } }
    }

    // Calculate service fee based on freelancer's plan (Pro: 4%, Free: 6%)
    const freelancerPlan = await getUserPlan(auth.adminDb, proposal.freelancer_id)
    const { serviceFee, taxAmount } = calculateFees(body.amount, freelancerPlan.service_fee_percent)

    // Use atomic transaction function
    const { data: result, error } = await auth.adminDb.rpc('create_escrow_transaction', {
      p_proposal_id: body.proposal_id,
      p_amount: body.amount,
      p_client_id: auth.profile.id,
      p_service_fee: serviceFee,
      p_tax_amount: taxAmount,
    })

    if (error || !result?.success) {
      return { status: 400, body: { error: result?.error || 'Failed to create escrow' } }
    }

    // Audit escrow creation
    await auditEscrowOperation(
      auth.adminDb,
      auth.userId,
      'escrow_create',
      body.amount,
      result.escrow_id,
      ipAddress,
      {
        proposal_id: body.proposal_id,
        service_fee: serviceFee,
        tax_amount: taxAmount,
      }
    )

    return {
      status: 201,
      body: {
        escrow_id: result.escrow_id,
        amount: body.amount,
        service_fee: serviceFee,
        tax_amount: taxAmount,
        new_balance: result.new_balance,
      },
    }
  })
}

// GET /api/escrow — List user's escrow transactions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const orgId = url.searchParams.get('organization_id')

  let query = auth.adminDb
    .from('escrow_transactions')
    .select('*, job:jobs!job_id(id, title, status, organization_id), client:profiles!client_id(id, full_name), freelancer:profiles!freelancer_id(id, full_name)')
    .order('initiated_at', { ascending: false })

  // Filter by org mode or personal mode
  if (orgId) {
    const { data: orgJobs } = await auth.adminDb.from('jobs').select('id').eq('organization_id', orgId)
    const orgJobIds = (orgJobs || []).map((j: { id: string }) => j.id)
    if (orgJobIds.length === 0) {
      return jsonResponse({ escrows: [] })
    }
    query = query.in('job_id', orgJobIds)
  } else {
    query = query.or(`client_id.eq.${auth.profile.id},freelancer_id.eq.${auth.profile.id}`)
  }

  const { data: escrows, error } = await query

  if (error) return errorResponse('Failed to fetch escrow transactions', 500)

  return jsonResponse({ escrows })
}
