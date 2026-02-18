/**
 * Comprehensive Audit Logging for Financial Transactions
 * 
 * Logs all critical operations for compliance and fraud detection.
 * Meets PCI DSS Requirement 10: Log and Monitor All Access
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction =
  | 'wallet_deposit'
  | 'wallet_withdraw'
  | 'escrow_create'
  | 'escrow_release'
  | 'escrow_refund'
  | 'proposal_accept'
  | 'proposal_reject'
  | 'profile_update'
  | 'password_change'
  | 'mfa_enable'
  | 'mfa_disable'
  | 'login_success'
  | 'login_failure'
  | 'api_key_create'
  | 'api_key_revoke'

export interface AuditLogEntry {
  userId: string
  profileId?: string
  action: AuditAction
  resource: string
  resourceId?: string
  amount?: number
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}

/**
 * Create audit log entry
 */
export async function auditLog(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    // Log to database
    await supabase.from('audit_log').insert({
      user_id: entry.userId,
      profile_id: entry.profileId,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      amount: entry.amount,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      success: entry.success,
      error_message: entry.errorMessage,
      metadata: entry.metadata || {},
      timestamp: new Date().toISOString(),
    })
    
    // For high-value transactions, also log to external SIEM
    if (entry.amount && entry.amount > 10000) {
      await alertHighValueTransaction(entry)
    }
    
    // For failed security operations, send alert
    if (!entry.success && isSecurityAction(entry.action)) {
      await alertSecurityFailure(entry)
    }
  } catch (error) {
    // Critical: Audit logging failure should be logged but not fail the operation
    console.error('❌ AUDIT LOG FAILURE:', error, entry)
    
    // In production, send to external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external logging service (e.g., Datadog, Splunk)
    }
  }
}

/**
 * Log financial transaction
 */
export async function auditFinancialTransaction(
  supabase: SupabaseClient,
  userId: string,
  action: AuditAction,
  amount: number,
  resourceId: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditLog(supabase, {
    userId,
    action,
    resource: 'financial_transaction',
    resourceId,
    amount,
    ipAddress,
    userAgent,
    success: true,
    metadata,
  })
}

/**
 * Log wallet operation
 */
export async function auditWalletOperation(
  supabase: SupabaseClient,
  userId: string,
  action: 'wallet_deposit' | 'wallet_withdraw',
  amount: number,
  walletId: string,
  success: boolean,
  ipAddress?: string,
  errorMessage?: string
): Promise<void> {
  await auditLog(supabase, {
    userId,
    action,
    resource: 'wallet',
    resourceId: walletId,
    amount,
    ipAddress,
    success,
    errorMessage,
  })
}

/**
 * Log escrow operation
 */
export async function auditEscrowOperation(
  supabase: SupabaseClient,
  userId: string,
  action: 'escrow_create' | 'escrow_release' | 'escrow_refund',
  amount: number,
  escrowId: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditLog(supabase, {
    userId,
    action,
    resource: 'escrow',
    resourceId: escrowId,
    amount,
    ipAddress,
    success: true,
    metadata,
  })
}

/**
 * Log security event
 */
export async function auditSecurityEvent(
  supabase: SupabaseClient,
  userId: string,
  action: AuditAction,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
): Promise<void> {
  await auditLog(supabase, {
    userId,
    action,
    resource: 'security',
    ipAddress,
    userAgent,
    success,
    errorMessage,
  })
}

/**
 * Check if action is security-related
 */
function isSecurityAction(action: AuditAction): boolean {
  return [
    'login_success',
    'login_failure',
    'password_change',
    'mfa_enable',
    'mfa_disable',
    'api_key_create',
    'api_key_revoke',
  ].includes(action)
}

/**
 * Alert on high-value transaction
 */
async function alertHighValueTransaction(entry: AuditLogEntry): Promise<void> {
  console.warn('🚨 HIGH VALUE TRANSACTION:', {
    userId: entry.userId,
    action: entry.action,
    amount: entry.amount,
    timestamp: new Date().toISOString(),
  })
  
  // TODO: Send to external alerting service (e.g., PagerDuty, Slack)
  // TODO: Notify security team
}

/**
 * Alert on security failure
 */
async function alertSecurityFailure(entry: AuditLogEntry): Promise<void> {
  console.error('🚨 SECURITY EVENT FAILURE:', {
    userId: entry.userId,
    action: entry.action,
    error: entry.errorMessage,
    ipAddress: entry.ipAddress,
    timestamp: new Date().toISOString(),
  })
  
  // TODO: Send to SIEM
  // TODO: Notify security team
}

/**
 * Query audit logs (for admin dashboard)
 */
export async function getAuditLogs(
  supabase: SupabaseClient,
  filters: {
    userId?: string
    action?: AuditAction
    startDate?: string
    endDate?: string
    limit?: number
  }
) {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('timestamp', { ascending: false })
  
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  
  if (filters.action) {
    query = query.eq('action', filters.action)
  }
  
  if (filters.startDate) {
    query = query.gte('timestamp', filters.startDate)
  }
  
  if (filters.endDate) {
    query = query.lte('timestamp', filters.endDate)
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  
  return query
}
