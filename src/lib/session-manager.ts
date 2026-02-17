/**
 * Session Management Utility
 * Track and manage user sessions for security
 */

import { createClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminClient = createClient(supabaseUrl, supabaseServiceKey)

interface SessionInfo {
  sessionToken: string
  userId: string
  profileId: string
  ipAddress?: string
  userAgent?: string
  isCurrent?: boolean
}

interface DeviceInfo {
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  device?: string
  deviceType?: string
}

export async function createSession(info: SessionInfo): Promise<{ success: boolean; sessionId?: string }> {
  try {
    // Parse user agent for device info
    const deviceInfo = parseUserAgent(info.userAgent)
    
    // Get location from IP (optional - would need IP geolocation service)
    // const location = await getLocationFromIP(info.ipAddress)
    
    // Calculate expiration (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data, error } = await adminClient
      .from('user_sessions')
      .insert({
        user_id: info.userId,
        profile_id: info.profileId,
        session_token: info.sessionToken,
        device_info: deviceInfo,
        ip_address: info.ipAddress,
        user_agent: info.userAgent,
        is_current: info.isCurrent || false,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Session Manager] Create session error:', error)
      return { success: false }
    }

    return { success: true, sessionId: data.id }
  } catch (error) {
    console.error('[Session Manager] Create session exception:', error)
    return { success: false }
  }
}

export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await adminClient
      .from('user_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .is('revoked_at', null)
  } catch (error) {
    console.error('[Session Manager] Update session activity error:', error)
  }
}

export async function revokeSession(sessionId: string, revokedBy: string): Promise<{ success: boolean }> {
  try {
    const { error } = await adminClient
      .from('user_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq('id', sessionId)

    if (error) {
      console.error('[Session Manager] Revoke session error:', error)
      return { success: false }
    }

    return { success: true }
  } catch (error) {
    console.error('[Session Manager] Revoke session exception:', error)
    return { success: false }
  }
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<{ success: boolean; count: number }> {
  try {
    let query = adminClient
      .from('user_sessions')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: userId,
      })
      .eq('user_id', userId)
      .is('revoked_at', null)

    if (exceptSessionId) {
      query = query.neq('id', exceptSessionId)
    }

    const { data, error } = await query.select('id')

    if (error) {
      console.error('[Session Manager] Revoke all sessions error:', error)
      return { success: false, count: 0 }
    }

    return { success: true, count: data?.length || 0 }
  } catch (error) {
    console.error('[Session Manager] Revoke all sessions exception:', error)
    return { success: false, count: 0 }
  }
}

export async function getActiveSessions(userId: string) {
  try {
    const { data, error } = await adminClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_active', { ascending: false })

    if (error) {
      console.error('[Session Manager] Get active sessions error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Session Manager] Get active sessions exception:', error)
    return []
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await adminClient.rpc('cleanup_expired_sessions')
  } catch (error) {
    console.error('[Session Manager] Cleanup expired sessions error:', error)
  }
}

function parseUserAgent(userAgent?: string): DeviceInfo {
  if (!userAgent) return {}

  try {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      browser: result.browser.name,
      browserVersion: result.browser.version,
      os: result.os.name,
      osVersion: result.os.version,
      device: result.device.model || result.device.vendor,
      deviceType: result.device.type || 'desktop',
    }
  } catch (error) {
    console.error('[Session Manager] Parse user agent error:', error)
    return {}
  }
}

// Helper to get device icon based on device type
export function getDeviceIcon(deviceType?: string): string {
  switch (deviceType?.toLowerCase()) {
    case 'mobile':
      return '📱'
    case 'tablet':
      return '📱'
    case 'desktop':
    default:
      return '💻'
  }
}

// Helper to format last active time
export function formatLastActive(lastActive: string): string {
  const now = new Date()
  const active = new Date(lastActive)
  const diffMs = now.getTime() - active.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return active.toLocaleDateString()
}
