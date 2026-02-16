import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// DELETE /api/saved-jobs/[jobId] — Unsave a job
export async function DELETE(req: NextRequest, { params }: { params: { jobId: string } }) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { error } = await auth.supabase
    .from('saved_jobs')
    .delete()
    .eq('user_id', auth.profile.id)
    .eq('job_id', params.jobId)

  if (error) return errorResponse('Failed to unsave job', 500)

  return jsonResponse({ success: true, message: 'Job unsaved' })
}
