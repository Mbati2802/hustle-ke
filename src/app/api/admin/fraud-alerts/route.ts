import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getFraudStatistics } from '@/lib/fraud-detection'

// GET /api/admin/fraud-alerts — Get fraud alerts and statistics (admin only)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const daysBack = parseInt(url.searchParams.get('days') || '30')
    const status = url.searchParams.get('status') || 'pending'

    // Get statistics
    const stats = await getFraudStatistics(daysBack)

    // Get recent alerts
    let query = auth.supabase
      .from('fraud_alerts')
      .select(`
        id,
        alert_type,
        severity,
        description,
        status,
        created_at,
        profile_id,
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: alerts, error: alertsError } = await query

    if (alertsError) {
      console.error('[Admin Fraud Alerts] Alerts error:', alertsError)
    }

    // Get high-risk users
    const { data: highRiskUsers } = await auth.supabase
      .from('user_behavior_patterns')
      .select('user_id, profile_id, trust_score, transaction_count, profiles(full_name, email)')
      .lt('trust_score', 30)
      .order('trust_score', { ascending: true })
      .limit(10)

    // Get recent high-risk transactions
    const { data: highRiskTransactions } = await auth.supabase
      .from('transaction_risk_scores')
      .select('id, transaction_type, amount, risk_score, created_at, profile_id, profiles(full_name, email)')
      .gte('risk_score', 70)
      .order('created_at', { ascending: false })
      .limit(20)

    return jsonResponse({
      statistics: stats,
      alerts: alerts || [],
      high_risk_users: highRiskUsers || [],
      high_risk_transactions: highRiskTransactions || [],
    })
  } catch (error) {
    console.error('[Admin Fraud Alerts] Error:', error)
    return errorResponse('Failed to fetch fraud data', 500)
  }
}
