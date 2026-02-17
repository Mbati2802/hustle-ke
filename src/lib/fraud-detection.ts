/**
 * Fraud Detection System
 * Monitor transactions and detect suspicious activity
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

// Risk thresholds
const RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 50,
  HIGH: 70,
  CRITICAL: 90,
}

// Fraud detection rules
const FRAUD_RULES = {
  LARGE_TRANSACTION_MULTIPLIER: 5, // 5x average is suspicious
  VELOCITY_LIMIT: 10, // Max transactions per hour
  MAX_DAILY_AMOUNT: 100000, // KES 100,000 per day
  NEW_ACCOUNT_DAYS: 7, // Accounts < 7 days are higher risk
  UNUSUAL_HOUR_RANGE: [0, 5], // Transactions between 12am-5am are suspicious
}

interface TransactionData {
  transactionId: string
  transactionType: 'deposit' | 'withdrawal' | 'escrow' | 'release'
  userId: string
  profileId: string
  amount: number
  metadata?: Record<string, unknown>
}

interface RiskAssessment {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  flagged: boolean
  shouldBlock: boolean
}

/**
 * Calculate risk score for a transaction
 */
export async function assessTransactionRisk(data: TransactionData): Promise<RiskAssessment> {
  let riskScore = 0
  const riskFactors: string[] = []

  try {
    // Get user behavior pattern
    const { data: pattern } = await adminClient
      .from('user_behavior_patterns')
      .select('*')
      .eq('user_id', data.userId)
      .single()

    // Check 1: Large transaction compared to average
    if (pattern && pattern.avg_transaction_amount > 0) {
      const multiplier = data.amount / pattern.avg_transaction_amount
      if (multiplier > FRAUD_RULES.LARGE_TRANSACTION_MULTIPLIER) {
        riskScore += 25
        riskFactors.push(`Transaction ${multiplier.toFixed(1)}x larger than average`)
      }
    }

    // Check 2: New account
    const accountAgeDays = pattern?.account_age_days || 0
    if (accountAgeDays < FRAUD_RULES.NEW_ACCOUNT_DAYS) {
      riskScore += 20
      riskFactors.push(`New account (${accountAgeDays} days old)`)
    }

    // Check 3: Velocity check (transactions per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentTransactions } = await adminClient
      .from('transaction_risk_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', data.userId)
      .gte('created_at', oneHourAgo)

    if (recentTransactions && recentTransactions >= FRAUD_RULES.VELOCITY_LIMIT) {
      riskScore += 30
      riskFactors.push(`High velocity: ${recentTransactions} transactions in last hour`)
    }

    // Check 4: Daily amount limit
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayTransactions } = await adminClient
      .from('transaction_risk_scores')
      .select('amount')
      .eq('user_id', data.userId)
      .gte('created_at', todayStart.toISOString())

    const todayTotal = todayTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    if (todayTotal + data.amount > FRAUD_RULES.MAX_DAILY_AMOUNT) {
      riskScore += 25
      riskFactors.push(`Daily limit exceeded: KES ${(todayTotal + data.amount).toFixed(2)}`)
    }

    // Check 5: Unusual transaction time
    const currentHour = new Date().getHours()
    if (currentHour >= FRAUD_RULES.UNUSUAL_HOUR_RANGE[0] && currentHour <= FRAUD_RULES.UNUSUAL_HOUR_RANGE[1]) {
      riskScore += 15
      riskFactors.push(`Unusual time: ${currentHour}:00`)
    }

    // Check 6: First large withdrawal
    if (data.transactionType === 'withdrawal' && data.amount > 10000 && pattern?.transaction_count < 5) {
      riskScore += 20
      riskFactors.push('First large withdrawal from new account')
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical'
    if (riskScore >= RISK_THRESHOLDS.CRITICAL) {
      riskLevel = 'critical'
    } else if (riskScore >= RISK_THRESHOLDS.HIGH) {
      riskLevel = 'high'
    } else if (riskScore >= RISK_THRESHOLDS.MEDIUM) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    const flagged = riskScore >= RISK_THRESHOLDS.MEDIUM
    const shouldBlock = riskScore >= RISK_THRESHOLDS.CRITICAL

    return {
      riskScore,
      riskLevel,
      riskFactors,
      flagged,
      shouldBlock,
    }
  } catch (error) {
    console.error('[Fraud Detection] Risk assessment error:', error)
    // On error, return medium risk to be safe
    return {
      riskScore: 50,
      riskLevel: 'medium',
      riskFactors: ['Error during risk assessment'],
      flagged: true,
      shouldBlock: false,
    }
  }
}

/**
 * Record transaction risk score
 */
export async function recordTransactionRisk(
  data: TransactionData,
  assessment: RiskAssessment
): Promise<void> {
  try {
    await adminClient.from('transaction_risk_scores').insert({
      transaction_id: data.transactionId,
      transaction_type: data.transactionType,
      user_id: data.userId,
      profile_id: data.profileId,
      amount: data.amount,
      risk_score: assessment.riskScore,
      risk_factors: { factors: assessment.riskFactors },
      flagged: assessment.flagged,
    })

    // Update user behavior pattern
    const currentHour = new Date().getHours()
    const currentDay = new Date().getDay()
    
    await adminClient.rpc('update_user_behavior_pattern', {
      p_user_id: data.userId,
      p_profile_id: data.profileId,
      p_transaction_amount: data.amount,
      p_transaction_hour: currentHour,
      p_transaction_day: currentDay,
    })
  } catch (error) {
    console.error('[Fraud Detection] Record risk error:', error)
  }
}

/**
 * Create fraud alert
 */
export async function createFraudAlert(
  userId: string,
  profileId: string,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  relatedTransactionId?: string,
  relatedData?: Record<string, unknown>
): Promise<void> {
  try {
    await adminClient.from('fraud_alerts').insert({
      user_id: userId,
      profile_id: profileId,
      alert_type: alertType,
      severity,
      description,
      related_transaction_id: relatedTransactionId,
      related_data: relatedData || {},
      status: 'pending',
    })

    console.log(`[Fraud Detection] Alert created: ${alertType} (${severity}) for user ${userId}`)
  } catch (error) {
    console.error('[Fraud Detection] Create alert error:', error)
  }
}

/**
 * Check transaction and create alert if needed
 */
export async function monitorTransaction(data: TransactionData): Promise<RiskAssessment> {
  const assessment = await assessTransactionRisk(data)

  // Record risk score
  await recordTransactionRisk(data, assessment)

  // Create alert if flagged
  if (assessment.flagged) {
    const alertType = assessment.shouldBlock ? 'critical_transaction' : 'suspicious_transaction'
    await createFraudAlert(
      data.userId,
      data.profileId,
      alertType,
      assessment.riskLevel,
      `${data.transactionType} of KES ${data.amount} flagged: ${assessment.riskFactors.join(', ')}`,
      data.transactionId,
      { riskScore: assessment.riskScore, factors: assessment.riskFactors }
    )
  }

  return assessment
}

/**
 * Get fraud statistics
 */
export async function getFraudStatistics(daysBack: number = 30) {
  try {
    const { data, error } = await adminClient.rpc('get_fraud_statistics', {
      days_back: daysBack,
    })

    if (error) {
      console.error('[Fraud Detection] Get statistics error:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('[Fraud Detection] Get statistics exception:', error)
    return null
  }
}

/**
 * Get user trust score
 */
export async function getUserTrustScore(userId: string): Promise<number> {
  try {
    const { data } = await adminClient
      .from('user_behavior_patterns')
      .select('trust_score')
      .eq('user_id', userId)
      .single()

    return data?.trust_score || 50
  } catch (error) {
    console.error('[Fraud Detection] Get trust score error:', error)
    return 50
  }
}

/**
 * Update user trust score
 */
export async function updateUserTrustScore(userId: string, adjustment: number): Promise<void> {
  try {
    const currentScore = await getUserTrustScore(userId)
    const newScore = Math.max(0, Math.min(100, currentScore + adjustment))

    await adminClient
      .from('user_behavior_patterns')
      .update({ trust_score: newScore, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  } catch (error) {
    console.error('[Fraud Detection] Update trust score error:', error)
  }
}
