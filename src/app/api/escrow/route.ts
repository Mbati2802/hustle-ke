import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'
import { getUserPlan, calculateFees } from '@/lib/subscription-utils'

// POST /api/escrow — Create escrow for an accepted proposal (client funds escrow)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{ proposal_id: string; amount: number }>(req)
  if (!body || !body.proposal_id || !body.amount) {
    return errorResponse('proposal_id and amount are required')
  }

  if (body.amount < 100) return errorResponse('Minimum escrow amount is KES 100')

  // Verify proposal exists and is accepted
  const { data: proposal } = await auth.supabase
    .from('proposals')
    .select('*, job:jobs!job_id(id, client_id, status)')
    .eq('id', body.proposal_id)
    .single()

  if (!proposal) return errorResponse('Proposal not found', 404)
  if (proposal.status !== 'Accepted') return errorResponse('Proposal must be accepted first', 400)
  if (proposal.job?.client_id !== auth.profile.id && auth.profile.role !== 'Admin') {
    return errorResponse('Only the job client can fund escrow', 403)
  }

  // Check for existing active escrow on this proposal
  const { data: existingEscrow } = await auth.supabase
    .from('escrow_transactions')
    .select('id')
    .eq('proposal_id', body.proposal_id)
    .in('status', ['Pending', 'Held'])
    .single()

  if (existingEscrow) return errorResponse('An active escrow already exists for this proposal', 409)

  // Calculate service fee based on freelancer's plan (Pro: 4%, Free: 6%)
  const freelancerPlan = await getUserPlan(auth.adminDb, proposal.freelancer_id)
  const { serviceFee, taxAmount } = calculateFees(body.amount, freelancerPlan.service_fee_percent)

  const { data: escrow, error } = await auth.supabase
    .from('escrow_transactions')
    .insert({
      job_id: proposal.job_id,
      proposal_id: body.proposal_id,
      client_id: auth.profile.id,
      freelancer_id: proposal.freelancer_id,
      amount: body.amount,
      status: 'Pending',
      transaction_type: 'Escrow',
      service_fee: serviceFee,
      tax_amount: taxAmount,
      description: `Escrow for job: ${proposal.job?.id}`,
    })
    .select()
    .single()

  if (error) return errorResponse('Failed to create escrow', 500)

  return jsonResponse({ escrow }, 201)
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
