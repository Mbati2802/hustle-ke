import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/admin/support/assignments — get unread assignments for current user
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: assignments, error } = await auth.adminDb
    .from('support_assignments')
    .select(`
      *,
      ticket:support_tickets(
        id,
        subject,
        category,
        urgency,
        status,
        user:profiles!user_id(id, full_name, email)
      )
    `)
    .eq('assigned_to', auth.profile.id)
    .is('viewed_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Support Assignments] fetch error:', error)
    return errorResponse('Failed to fetch assignments', 500)
  }

  return jsonResponse({
    assignments: assignments || [],
    count: assignments?.length || 0,
  })
}

// PUT /api/admin/support/assignments — mark assignment as viewed
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await req.json().catch(() => ({}))
  const assignmentId = body.assignment_id

  if (!assignmentId) return errorResponse('Missing assignment_id', 400)

  const { error } = await auth.adminDb
    .from('support_assignments')
    .update({
      viewed_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .eq('assigned_to', auth.profile.id)

  if (error) {
    console.error('[Support Assignments] mark viewed error:', error)
    return errorResponse('Failed to mark assignment as viewed', 500)
  }

  return jsonResponse({ success: true })
}
