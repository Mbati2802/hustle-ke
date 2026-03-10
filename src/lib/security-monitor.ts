// Security Monitoring Service - Automatic alert generation for suspicious activities

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface SecurityAlert {
  user_id: string
  alert_type: 'failed_login' | 'unusual_ip' | 'account_takeover' | 'data_breach' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  ip_address: string
  user_agent?: string
  metadata?: Record<string, any>
}

// Track failed login attempts
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number; ips: Set<string> }>()

export async function trackFailedLogin(email: string, ipAddress: string, userAgent?: string) {
  const key = email.toLowerCase()
  const now = Date.now()
  
  if (!failedLoginAttempts.has(key)) {
    failedLoginAttempts.set(key, { count: 0, lastAttempt: now, ips: new Set() })
  }
  
  const attempts = failedLoginAttempts.get(key)!
  
  // Reset if last attempt was more than 15 minutes ago
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0
    attempts.ips.clear()
  }
  
  attempts.count++
  attempts.lastAttempt = now
  attempts.ips.add(ipAddress)
  
  // Generate alert after 3 failed attempts
  if (attempts.count >= 3) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('email', email)
      .single()
    
    if (profile) {
      await createSecurityAlert({
        user_id: profile.id,
        alert_type: 'failed_login',
        severity: attempts.count >= 5 ? 'high' : 'medium',
        description: `${attempts.count} failed login attempts from ${attempts.ips.size} different IP(s)`,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          attempt_count: attempts.count,
          ip_addresses: Array.from(attempts.ips),
          time_window: '15 minutes'
        }
      })
    }
  }
}

export async function trackUnusualIP(userId: string, ipAddress: string, userAgent?: string) {
  // Get user's recent IPs
  const { data: recentSessions } = await supabase
    .from('user_sessions')
    .select('ip_address')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const knownIPs = new Set(recentSessions?.map(s => s.ip_address) || [])
  
  // If this is a new IP, create alert
  if (!knownIPs.has(ipAddress) && knownIPs.size > 0) {
    await createSecurityAlert({
      user_id: userId,
      alert_type: 'unusual_ip',
      severity: 'medium',
      description: `Login from new IP address: ${ipAddress}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        known_ips: Array.from(knownIPs),
        new_ip: ipAddress
      }
    })
  }
}

export async function trackSuspiciousActivity(
  userId: string,
  activityType: string,
  description: string,
  ipAddress: string,
  metadata?: Record<string, any>
) {
  await createSecurityAlert({
    user_id: userId,
    alert_type: 'suspicious_activity',
    severity: 'high',
    description: `${activityType}: ${description}`,
    ip_address: ipAddress,
    metadata: {
      activity_type: activityType,
      ...metadata
    }
  })
}

export async function createSecurityAlert(alert: SecurityAlert) {
  const { error } = await supabase
    .from('security_alerts')
    .insert({
      user_id: alert.user_id,
      alert_type: alert.alert_type,
      severity: alert.severity,
      description: alert.description,
      ip_address: alert.ip_address,
      user_agent: alert.user_agent,
      metadata: alert.metadata,
      status: 'active',
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('[Security Monitor] Failed to create alert:', error)
    return false
  }
  
  // Send notification for critical alerts
  if (alert.severity === 'critical' || alert.severity === 'high') {
    await notifyAdmins(alert)
  }
  
  return true
}

async function notifyAdmins(alert: SecurityAlert) {
  // Get all admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'Admin')
  
  if (!admins || admins.length === 0) return
  
  // Create notifications for each admin
  const notifications = admins.map(admin => ({
    user_id: admin.id,
    type: 'security_alert',
    title: `Security Alert: ${alert.alert_type}`,
    message: alert.description,
    metadata: {
      alert_type: alert.alert_type,
      severity: alert.severity,
      affected_user: alert.user_id
    },
    created_at: new Date().toISOString()
  }))
  
  await supabase.from('notifications').insert(notifications)
}

// Monitor wallet transactions for suspicious patterns
export async function monitorWalletTransaction(
  userId: string,
  amount: number,
  type: string,
  ipAddress: string
) {
  // Check for large withdrawals
  if (type === 'Withdrawal' && amount > 50000) {
    await createSecurityAlert({
      user_id: userId,
      alert_type: 'suspicious_activity',
      severity: 'high',
      description: `Large withdrawal attempt: KES ${amount.toLocaleString()}`,
      ip_address: ipAddress,
      metadata: {
        transaction_type: type,
        amount: amount,
        threshold: 50000
      }
    })
  }
  
  // Check for rapid transactions
  const { data: recentTransactions } = await supabase
    .from('wallet_transactions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
  
  if (recentTransactions && recentTransactions.length > 10) {
    await createSecurityAlert({
      user_id: userId,
      alert_type: 'suspicious_activity',
      severity: 'medium',
      description: `Rapid transaction activity: ${recentTransactions.length} transactions in 5 minutes`,
      ip_address: ipAddress,
      metadata: {
        transaction_count: recentTransactions.length,
        time_window: '5 minutes'
      }
    })
  }
}

// Clean up old failed login attempts (run periodically)
export function cleanupFailedAttempts() {
  const now = Date.now()
  const cutoff = 15 * 60 * 1000 // 15 minutes
  
  const keysToDelete: string[] = []
  failedLoginAttempts.forEach((attempts, key) => {
    if (now - attempts.lastAttempt > cutoff) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => failedLoginAttempts.delete(key))
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupFailedAttempts, 5 * 60 * 1000)
}
