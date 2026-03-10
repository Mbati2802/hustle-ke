import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/admin/fraud/[id] — Get fraud alert details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const { data: alert, error } = await auth.supabase
    .from('fraud_alerts')
    .select(`
      *,
      profile:profiles!user_id(
        id,
        full_name,
        email,
        role,
        phone,
        avatar_url,
        created_at
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !alert) return errorResponse('Fraud alert not found', 404)

  // Get user's fraud score history
  const { data: scoreHistory } = await auth.supabase
    .from('fraud_scores')
    .select('*')
    .eq('user_id', alert.user_id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get related transactions
  const { data: transactions } = await auth.supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', alert.user_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return jsonResponse({
    alert,
    score_history: scoreHistory || [],
    recent_transactions: transactions || []
  })
}

// PUT /api/admin/fraud/[id] — Update fraud alert status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    status?: 'pending' | 'reviewed' | 'resolved' | 'false_positive'
    admin_notes?: string
    action_taken?: string
  }>(req)

  if (!body) return errorResponse('Invalid request body')

  const updateData: Record<string, any> = {
    reviewed_by: auth.profile.id,
    reviewed_at: new Date().toISOString()
  }

  if (body.status) updateData.status = body.status
  if (body.admin_notes) updateData.admin_notes = body.admin_notes
  if (body.action_taken) updateData.action_taken = body.action_taken

  const { data: alert, error } = await auth.supabase
    .from('fraud_alerts')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    console.error('[Admin Fraud] Update error:', error)
    return errorResponse('Failed to update fraud alert', 500)
  }

  // Log activity
  await auth.supabase.from('activity_log').insert({
    admin_id: auth.profile.id,
    action: 'review_fraud_alert',
    entity_type: 'fraud_alerts',
    entity_id: params.id,
    details: updateData,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  })

  return jsonResponse({ alert })
}
