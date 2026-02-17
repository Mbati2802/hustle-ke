/**
 * Security Alerts System
 * Track devices, detect suspicious activity, send email alerts
 */

import { createClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'
import { sendNotification } from './notifications'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

interface DeviceInfo {
  browser?: string
  browserVersion?: string
  os?: string
  osVersion?: string
  device?: string
  deviceType?: string
}

interface LoginInfo {
  userId: string
  profileId: string
  ipAddress?: string
  userAgent?: string
  deviceFingerprint?: string
  loginSuccessful?: boolean
}

// Generate device fingerprint from user agent + IP
export function generateDeviceFingerprint(userAgent?: string, ipAddress?: string): string {
  const ua = userAgent || 'unknown'
  const ip = ipAddress || 'unknown'
  // Simple fingerprint - in production, use more sophisticated method
  return Buffer.from(`${ua}-${ip}`).toString('base64').substring(0, 32)
}

// Parse user agent to extract device info
export function parseDeviceInfo(userAgent?: string): DeviceInfo {
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
    console.error('[Security Alerts] Parse device info error:', error)
    return {}
  }
}

// Record login attempt
export async function recordLogin(info: LoginInfo): Promise<{ isNewDevice: boolean }> {
  try {
    const deviceFingerprint = info.deviceFingerprint || generateDeviceFingerprint(info.userAgent, info.ipAddress)
    const deviceInfo = parseDeviceInfo(info.userAgent)

    // Check if this is a new device
    const { data: existingLogins } = await adminClient
      .from('login_history')
      .select('id')
      .eq('user_id', info.userId)
      .eq('device_fingerprint', deviceFingerprint)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    const isNewDevice = !existingLogins || existingLogins.length === 0

    // Record login
    await adminClient.from('login_history').insert({
      user_id: info.userId,
      profile_id: info.profileId,
      device_fingerprint: deviceFingerprint,
      ip_address: info.ipAddress,
      user_agent: info.userAgent,
      device_info: deviceInfo,
      is_new_device: isNewDevice,
      login_successful: info.loginSuccessful !== false,
      alert_sent: false,
    })

    return { isNewDevice }
  } catch (error) {
    console.error('[Security Alerts] Record login error:', error)
    return { isNewDevice: false }
  }
}

// Record security event
export async function recordSecurityEvent(
  userId: string,
  profileId: string,
  eventType: 'new_device' | 'password_change' | 'email_change' | 'suspicious_login',
  eventData: Record<string, unknown> = {},
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await adminClient.from('security_events').insert({
      user_id: userId,
      profile_id: profileId,
      event_type: eventType,
      event_data: eventData,
      ip_address: ipAddress,
      user_agent: userAgent,
      alert_sent: false,
    })
  } catch (error) {
    console.error('[Security Alerts] Record security event error:', error)
  }
}

// Send new device alert
export async function sendNewDeviceAlert(
  userId: string,
  profileId: string,
  deviceInfo: DeviceInfo,
  ipAddress?: string,
  location?: string
): Promise<void> {
  try {
    // Get user email
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', profileId)
      .single()

    if (!profile?.email) return

    const deviceName = `${deviceInfo.browser || 'Unknown Browser'} on ${deviceInfo.os || 'Unknown OS'}`
    const locationInfo = location || ipAddress || 'Unknown location'

    // Send in-app notification
    await sendNotification(adminClient, {
      userId: profileId,
      title: '🔐 New Device Login',
      message: `A new login was detected from ${deviceName} at ${locationInfo}. If this wasn't you, please change your password immediately.`,
      type: 'security',
      channels: ['site', 'email'],
    })

    // Mark alert as sent
    await adminClient
      .from('security_events')
      .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('event_type', 'new_device')
      .is('alert_sent', false)

    console.log(`[Security Alerts] New device alert sent to ${profile.email}`)
  } catch (error) {
    console.error('[Security Alerts] Send new device alert error:', error)
  }
}

// Send password change alert
export async function sendPasswordChangeAlert(userId: string, profileId: string, ipAddress?: string): Promise<void> {
  try {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', profileId)
      .single()

    if (!profile?.email) return

    await sendNotification(adminClient, {
      userId: profileId,
      title: '🔒 Password Changed',
      message: `Your password was recently changed. If you didn't make this change, please contact support immediately.`,
      type: 'security',
      channels: ['site', 'email'],
    })

    await adminClient
      .from('security_events')
      .update({ alert_sent: true, alert_sent_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('event_type', 'password_change')
      .is('alert_sent', false)

    console.log(`[Security Alerts] Password change alert sent to ${profile.email}`)
  } catch (error) {
    console.error('[Security Alerts] Send password change alert error:', error)
  }
}

// Get user's login history
export async function getLoginHistory(userId: string, limit = 10) {
  try {
    const { data, error } = await adminClient
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Security Alerts] Get login history error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Security Alerts] Get login history exception:', error)
    return []
  }
}

// Get user's security events
export async function getSecurityEvents(userId: string, limit = 20) {
  try {
    const { data, error } = await adminClient
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Security Alerts] Get security events error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Security Alerts] Get security events exception:', error)
    return []
  }
}
