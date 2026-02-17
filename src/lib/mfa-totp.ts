/**
 * MFA/TOTP (Two-Factor Authentication) Utilities
 * Generate TOTP secrets, QR codes, verify tokens, manage backup codes
 */

import { TOTP } from 'otplib'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

const APP_NAME = 'HustleKE'

// Create TOTP instance
const totp = new TOTP()
totp.options = {
  window: 1, // Allow 1 step before/after current time
}

/**
 * Generate a new TOTP secret
 */
export function generateTOTPSecret(): string {
  return totp.generateSecret()
}

/**
 * Generate QR code data URL for TOTP setup
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = `otpauth://totp/${APP_NAME}:${email}?secret=${secret}&issuer=${APP_NAME}`
  return await QRCode.toDataURL(otpauthUrl)
}

/**
 * Verify a TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return totp.verify({ token, secret })
  } catch (error) {
    console.error('[MFA] TOTP verification error:', error)
    return false
  }
}

/**
 * Generate backup codes (10 codes, 8 characters each)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate random 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify a backup code against stored hashes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(code)
  return hashedCodes.includes(hashedInput)
}

/**
 * Enable MFA for a user
 */
export async function enableMFA(
  userId: string,
  profileId: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hash backup codes before storing
    const hashedCodes = backupCodes.map(hashBackupCode)

    const { error } = await adminClient
      .from('mfa_settings')
      .upsert({
        user_id: userId,
        profile_id: profileId,
        totp_secret: secret,
        is_enabled: true,
        backup_codes: hashedCodes,
        backup_codes_used: 0,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('[MFA] Enable error:', error)
      return { success: false, error: 'Failed to enable MFA' }
    }

    return { success: true }
  } catch (error) {
    console.error('[MFA] Enable exception:', error)
    return { success: false, error: 'Failed to enable MFA' }
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMFA(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await adminClient
      .from('mfa_settings')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('[MFA] Disable error:', error)
      return { success: false, error: 'Failed to disable MFA' }
    }

    return { success: true }
  } catch (error) {
    console.error('[MFA] Disable exception:', error)
    return { success: false, error: 'Failed to disable MFA' }
  }
}

/**
 * Get MFA settings for a user
 */
export async function getMFASettings(userId: string) {
  try {
    const { data, error } = await adminClient
      .from('mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[MFA] Get settings error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[MFA] Get settings exception:', error)
    return null
  }
}

/**
 * Verify MFA token (TOTP or backup code)
 */
export async function verifyMFAToken(
  userId: string,
  profileId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; method?: 'totp' | 'backup_code'; error?: string }> {
  try {
    const settings = await getMFASettings(userId)

    if (!settings || !settings.is_enabled) {
      return { success: false, error: 'MFA not enabled' }
    }

    let success = false
    let method: 'totp' | 'backup_code' = 'totp'

    // Try TOTP first
    if (verifyTOTPToken(token, settings.totp_secret)) {
      success = true
      method = 'totp'
    }
    // Try backup code
    else if (verifyBackupCode(token, settings.backup_codes || [])) {
      success = true
      method = 'backup_code'

      // Remove used backup code and increment counter
      const hashedToken = hashBackupCode(token)
      const updatedCodes = (settings.backup_codes || []).filter((code: string) => code !== hashedToken)

      await adminClient
        .from('mfa_settings')
        .update({
          backup_codes: updatedCodes,
          backup_codes_used: (settings.backup_codes_used || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    // Log verification attempt
    await adminClient.from('mfa_verification_log').insert({
      user_id: userId,
      profile_id: profileId,
      verification_method: method,
      success,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (!success) {
      return { success: false, error: 'Invalid verification code' }
    }

    return { success: true, method }
  } catch (error) {
    console.error('[MFA] Verify token exception:', error)
    return { success: false, error: 'Verification failed' }
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<{ success: boolean; codes?: string[]; error?: string }> {
  try {
    const settings = await getMFASettings(userId)

    if (!settings) {
      return { success: false, error: 'MFA not configured' }
    }

    const newCodes = generateBackupCodes()
    const hashedCodes = newCodes.map(hashBackupCode)

    const { error } = await adminClient
      .from('mfa_settings')
      .update({
        backup_codes: hashedCodes,
        backup_codes_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[MFA] Regenerate backup codes error:', error)
      return { success: false, error: 'Failed to regenerate backup codes' }
    }

    return { success: true, codes: newCodes }
  } catch (error) {
    console.error('[MFA] Regenerate backup codes exception:', error)
    return { success: false, error: 'Failed to regenerate backup codes' }
  }
}

/**
 * Get MFA verification log
 */
export async function getMFAVerificationLog(userId: string, limit: number = 20) {
  try {
    const { data, error } = await adminClient
      .from('mfa_verification_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[MFA] Get verification log error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[MFA] Get verification log exception:', error)
    return []
  }
}
