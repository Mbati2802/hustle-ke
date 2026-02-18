import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'
import { analyzeJob, analyzeClient, matchFreelancer, generateStrategy, generateProposal } from '@/lib/proposalforge-engine'

// GET /api/proposalforge?job_id=xxx — Generate a proposal draft for a job
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')

  if (!jobId) return errorResponse('job_id required', 400)

  // Get the job
  const { data: job } = await auth.adminDb
    .from('jobs')
    .select('id, title, description, budget_min, budget_max, category, skills_required, client_id')
    .eq('id', jobId)
    .single()

  if (!job) return errorResponse('Job not found', 404)

  // Get client's hiring history
  const { data: clientJobs } = await auth.adminDb
    .from('jobs')
    .select('budget_min, budget_max, status, category, skills_required')
    .eq('client_id', job.client_id)
    .limit(20)

  // Get client's reviews (reviews they've given to freelancers)
  const { data: clientReviews } = await auth.adminDb
    .from('reviews')
    .select('rating, comment')
    .eq('reviewer_id', job.client_id)
    .limit(20)

  // Get freelancer's verified skills
  const { data: verifiedSkills } = await auth.adminDb
    .from('verified_skills')
    .select('skill_name, badge_level')
    .eq('user_id', auth.profile.id)

  // Check if draft already exists
  const { data: existingDraft } = await auth.adminDb
    .from('proposal_drafts')
    .select('*')
    .eq('user_id', auth.profile.id)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingDraft) {
    return jsonResponse({
      draft: existingDraft,
      is_existing: true,
    })
  }

  // Run the AI analysis pipeline
  const jobAnalysis = analyzeJob(job)
  const clientAnalysis = analyzeClient({
    jobs: clientJobs || [],
    reviews: clientReviews || [],
  })
  const freelancerMatchResult = matchFreelancer(
    auth.profile,
    verifiedSkills || [],
    jobAnalysis
  )
  const strategy = generateStrategy(jobAnalysis, clientAnalysis, freelancerMatchResult)

  // Generate the proposal
  const coverLetter = generateProposal(
    strategy,
    auth.profile.full_name || 'Freelancer',
    job.title,
    clientAnalysis.prefersBriefProposals
  )

  // Save the draft
  const { data: draft, error: draftError } = await auth.adminDb
    .from('proposal_drafts')
    .insert({
      user_id: auth.profile.id,
      job_id: jobId,
      job_analysis: jobAnalysis,
      client_analysis: clientAnalysis,
      freelancer_match: freelancerMatchResult,
      strategy,
      generated_cover_letter: coverLetter,
      generated_bid_amount: strategy.recommendedBid || null,
      generated_duration_days: strategy.estimatedDuration,
    })
    .select('*')
    .single()

  if (draftError) {
    console.error('Failed to save draft:', draftError)
    // Still return the generated content even if save fails
    return jsonResponse({
      draft: {
        job_analysis: jobAnalysis,
        client_analysis: clientAnalysis,
        freelancer_match: freelancerMatchResult,
        strategy,
        generated_cover_letter: coverLetter,
        generated_bid_amount: strategy.recommendedBid,
        generated_duration_days: strategy.estimatedDuration,
      },
      is_existing: false,
      save_failed: true,
    })
  }

  return jsonResponse({
    draft,
    is_existing: false,
  })
}

// POST /api/proposalforge — Update draft or track outcome
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: string
    draft_id?: string
    final_cover_letter?: string
    final_bid_amount?: number
    proposal_id?: string
    outcome?: string
  }>(req)

  if (!body?.action) return errorResponse('Action required', 400)

  // Update draft with user's edits
  if (body.action === 'update') {
    const { draft_id, final_cover_letter, final_bid_amount } = body
    if (!draft_id) return errorResponse('draft_id required', 400)

    const updates: Record<string, unknown> = { was_edited: true }
    if (final_cover_letter) {
      updates.final_cover_letter = final_cover_letter

      // Calculate edit percentage
      const { data: draft } = await auth.adminDb
        .from('proposal_drafts')
        .select('generated_cover_letter')
        .eq('id', draft_id)
        .eq('user_id', auth.profile.id)
        .single()

      if (draft) {
        const original = draft.generated_cover_letter || ''
        const edited = final_cover_letter
        const maxLen = Math.max(original.length, edited.length)
        let diffChars = 0
        for (let i = 0; i < maxLen; i++) {
          if (original[i] !== edited[i]) diffChars++
        }
        updates.edit_percentage = maxLen > 0 ? Math.round((diffChars / maxLen) * 100) : 0
      }
    }
    if (final_bid_amount) updates.final_bid_amount = final_bid_amount

    const { error } = await auth.adminDb
      .from('proposal_drafts')
      .update(updates)
      .eq('id', draft_id)
      .eq('user_id', auth.profile.id)

    if (error) return errorResponse('Failed to update draft', 500)
    return jsonResponse({ success: true })
  }

  // Link draft to submitted proposal
  if (body.action === 'link') {
    const { draft_id, proposal_id } = body
    if (!draft_id || !proposal_id) return errorResponse('draft_id and proposal_id required', 400)

    await auth.adminDb
      .from('proposal_drafts')
      .update({
        proposal_id,
        outcome: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', draft_id)
      .eq('user_id', auth.profile.id)

    return jsonResponse({ success: true })
  }

  // Track outcome
  if (body.action === 'outcome') {
    const { draft_id, outcome } = body
    if (!draft_id || !outcome) return errorResponse('draft_id and outcome required', 400)

    await auth.adminDb
      .from('proposal_drafts')
      .update({ outcome })
      .eq('id', draft_id)
      .eq('user_id', auth.profile.id)

    return jsonResponse({ success: true })
  }

  return errorResponse('Invalid action', 400)
}
