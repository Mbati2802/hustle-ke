import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// POST /api/jobs/[id]/approve — Client approves or requests revision of submitted work
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Verify the job exists and is in Review
  const { data: job, error: jobErr } = await auth.adminDb
    .from('jobs')
    .select('id, client_id, status, organization_id')
    .eq('id', params.id)
    .single()

  if (jobErr) console.error('[approve] Job fetch error:', jobErr)
  if (!job) return errorResponse('Job not found', 404)

  // Only the client, org owner/admin, or platform admin can approve
  let hasAccess = job.client_id === auth.profile.id || auth.profile.role === 'Admin'
  if (!hasAccess && job.organization_id) {
    const { data: membership } = await auth.adminDb
      .from('organization_members')
      .select('role')
      .eq('organization_id', job.organization_id)
      .eq('user_id', auth.profile.id)
      .in('role', ['owner', 'admin'])
      .single()
    if (membership) hasAccess = true
  }
  if (!hasAccess) {
    return errorResponse('Only the job owner can approve or request revisions', 403)
  }

  if (job.status !== 'Review') {
    return errorResponse('This job is not awaiting review', 400)
  }

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const action = (body as Record<string, unknown>).action as string
  const message = (body as Record<string, unknown>).message as string || ''

  // Get the hired freelancer
  const { data: proposal } = await auth.adminDb
    .from('proposals')
    .select('id, freelancer_id')
    .eq('job_id', params.id)
    .eq('status', 'Accepted')
    .single()

  if (action === 'approve') {
    // Mark job as Completed
    let updated, error
    // Try with completed_at first; if column doesn't exist, retry without it
    ;({ data: updated, error } = await auth.adminDb
      .from('jobs')
      .update({ status: 'Completed', completed_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single())

    if (error && error.message?.includes('completed_at')) {
      console.warn('[approve] completed_at column missing, retrying without it')
      ;({ data: updated, error } = await auth.adminDb
        .from('jobs')
        .update({ status: 'Completed' })
        .eq('id', params.id)
        .select()
        .single())
    }

    if (error) {
      console.error('[approve] Approve update error:', error)
      return errorResponse('Failed to approve work', 500)
    }

    // Notify freelancer
    if (proposal?.freelancer_id) {
      await auth.adminDb
        .from('messages')
        .insert({
          job_id: params.id,
          sender_id: auth.profile.id,
          receiver_id: proposal.freelancer_id,
          content: `✅ Work Approved! ${message ? `Client says: "${message}"` : 'The client has approved your work. Payment will be released from escrow.'}`,
        })
    }

    return jsonResponse({
      job: updated,
      message: 'Work approved! You can now release the escrow payment.',
    })
  }

  if (action === 'revision') {
    if (!message) {
      return errorResponse('Please provide feedback on what needs to be revised', 400)
    }

    const revisionDetails = (body as Record<string, unknown>).revision_details as Record<string, unknown> | undefined

    // Move job back to In-Progress and store revision details
    const { data: updated, error } = await auth.adminDb
      .from('jobs')
      .update({
        status: 'In-Progress',
        submission_details: null, // Clear old submission so freelancer can resubmit
      })
      .eq('id', params.id)
      .select('id, title, status')
      .single()

    if (error) {
      console.error('[approve] Revision update error:', error)
      return errorResponse('Failed to request revision', 500)
    }

    // Build comprehensive message for freelancer
    if (proposal?.freelancer_id) {
      const parts: string[] = [
        `🔄 Revision Requested for "${updated.title}"`,
        '',
        `Overall Feedback:`,
        message,
      ]

      if (revisionDetails) {
        const items = revisionDetails.items as Array<{ section: string; issue: string; expected: string }> | undefined
        const pri = revisionDetails.priority as string | undefined
        const dl = revisionDetails.deadline as string | undefined
        const notes = revisionDetails.additional_notes as string | undefined

        if (pri) {
          parts.push('', `Priority: ${pri.charAt(0).toUpperCase() + pri.slice(1)}`)
        }

        if (dl) {
          parts.push(`Deadline: ${new Date(dl).toLocaleDateString('en-KE', { dateStyle: 'medium' })}`)
        }

        if (items && items.length > 0) {
          parts.push('', 'Revision Items:')
          items.forEach((item, idx) => {
            parts.push(`${idx + 1}. ${item.section || 'General'}: ${item.issue}`)
            if (item.expected) parts.push(`   Expected: ${item.expected}`)
          })
        }

        if (notes) {
          parts.push('', `Additional Notes: ${notes}`)
        }
      }

      parts.push('', 'Please review the feedback above and resubmit your work when ready.')

      await auth.adminDb
        .from('messages')
        .insert({
          job_id: params.id,
          sender_id: auth.profile.id,
          receiver_id: proposal.freelancer_id,
          content: parts.join('\n'),
        })
    }

    return jsonResponse({
      job: updated,
      message: 'Revision requested. The freelancer has been notified.',
    })
  }

  return errorResponse('Invalid action. Use "approve" or "revision".', 400)

  } catch (err) {
    console.error('[approve] Unhandled error:', err)
    return errorResponse('Internal server error', 500)
  }
}
