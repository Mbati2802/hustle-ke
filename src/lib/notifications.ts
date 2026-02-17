import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | 'message'
  | 'hire'
  | 'rejection'
  | 'proposal'
  | 'submission'
  | 'revision'
  | 'subscription'
  | 'escrow'
  | 'system'
  | 'info'
  | 'review_request'
  | 'security'

export type NotificationChannel = 'site' | 'email' | 'sms'

export interface NotificationPayload {
  userId: string        // Profile ID of the recipient
  type: NotificationType
  title: string
  message: string
  link?: string
  channels?: NotificationChannel[] // defaults to all enabled channels
  metadata?: Record<string, unknown>
}

interface UserPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  job_alerts: boolean
  message_alerts: boolean
  proposal_alerts: boolean
  subscription_alerts: boolean
  escrow_alerts: boolean
  marketing: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  email_enabled: true,
  sms_enabled: true,
  push_enabled: true,
  job_alerts: true,
  message_alerts: true,
  proposal_alerts: true,
  subscription_alerts: true,
  escrow_alerts: true,
  marketing: false,
}

// Map notification type to preference category
const TYPE_TO_CATEGORY: Record<NotificationType, keyof UserPreferences | null> = {
  message: 'message_alerts',
  hire: 'proposal_alerts',
  rejection: 'proposal_alerts',
  proposal: 'proposal_alerts',
  submission: 'job_alerts',
  revision: 'job_alerts',
  subscription: 'subscription_alerts',
  escrow: 'escrow_alerts',
  system: null, // always sent
  info: null,   // always sent
  review_request: 'job_alerts',
  security: null, // always sent (critical security alerts)
}

// ============================================
// MAIN NOTIFICATION FUNCTION
// ============================================

/**
 * Send a notification through all enabled channels (site, email, SMS).
 * Uses adminDb (service role) to bypass RLS.
 */
export async function sendNotification(
  adminDb: SupabaseClient,
  payload: NotificationPayload
): Promise<{ site: boolean; email: boolean; sms: boolean }> {
  const result = { site: false, email: false, sms: false }

  try {
    // Fetch user preferences
    const prefs = await getUserPreferences(adminDb, payload.userId)

    // Check category preference
    const category = TYPE_TO_CATEGORY[payload.type]
    if (category && !prefs[category]) {
      // User has disabled this category — skip all channels
      return result
    }

    // Determine which channels to use
    const requestedChannels = payload.channels || ['site', 'email', 'sms']

    // Fetch user contact info for email/SMS
    const { data: profile } = await adminDb
      .from('profiles')
      .select('full_name, email, phone, mpesa_phone')
      .eq('id', payload.userId)
      .single()

    // 1. Site notification (always, if requested)
    if (requestedChannels.includes('site')) {
      result.site = await saveSiteNotification(adminDb, payload)
    }

    // 2. Email notification
    if (requestedChannels.includes('email') && prefs.email_enabled && profile?.email) {
      result.email = await sendEmailNotification({
        to: profile.email,
        name: profile.full_name,
        subject: payload.title,
        body: payload.message,
        link: payload.link,
        type: payload.type,
      })
    }

    // 3. SMS notification
    if (requestedChannels.includes('sms') && prefs.sms_enabled) {
      const phone = profile?.mpesa_phone || profile?.phone
      if (phone) {
        result.sms = await sendSmsNotification({
          to: phone,
          message: `[HustleKE] ${payload.title}: ${payload.message}`,
          type: payload.type,
        })
      }
    }
  } catch (err) {
    console.error('[Notifications] Error sending notification:', err)
  }

  return result
}

/**
 * Send notifications to multiple users at once.
 */
export async function sendBulkNotification(
  adminDb: SupabaseClient,
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  await Promise.allSettled(
    userIds.map(userId => sendNotification(adminDb, { ...payload, userId }))
  )
}

// ============================================
// SITE NOTIFICATIONS (DB)
// ============================================

async function saveSiteNotification(
  adminDb: SupabaseClient,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const { error } = await adminDb.from('notifications').insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link || null,
      metadata: payload.metadata || {},
      sent_site: true,
    })
    if (error) {
      console.error('[Notifications] DB insert error:', error)
      return false
    }
    return true
  } catch {
    return false
  }
}

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

interface EmailPayload {
  to: string
  name: string
  subject: string
  body: string
  link?: string
  type: NotificationType
}

/**
 * Send an email notification.
 * 
 * Supports two modes:
 * 1. SMTP mode: Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars
 * 2. Resend mode: Set RESEND_API_KEY env var
 * 
 * Falls back to console.log in development if no email provider is configured.
 */
async function sendEmailNotification(payload: EmailPayload): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY
  const smtpHost = process.env.SMTP_HOST

  // --- Resend ---
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'HustleKE <noreply@hustleke.co.ke>',
          to: payload.to,
          subject: `[HustleKE] ${payload.subject}`,
          html: buildEmailHtml(payload),
        }),
      })
      if (res.ok) {
        console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`)
        return true
      }
      const err = await res.text()
      console.error('[Email] Resend error:', err)
      return false
    } catch (err) {
      console.error('[Email] Resend send error:', err)
      return false
    }
  }

  // --- SMTP via nodemailer (if installed) ---
  if (smtpHost) {
    try {
      // Dynamic import to avoid build errors if nodemailer isn't installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = await import(/* webpackIgnore: true */ 'nodemailer').catch(() => null)
      if (!nodemailer) {
        console.warn('[Email] SMTP configured but nodemailer not installed. Run: npm install nodemailer')
        return false
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'HustleKE <noreply@hustleke.co.ke>',
        to: payload.to,
        subject: `[HustleKE] ${payload.subject}`,
        html: buildEmailHtml(payload),
      })
      console.log(`[Email] SMTP sent to ${payload.to}: ${payload.subject}`)
      return true
    } catch (err) {
      console.error('[Email] SMTP error:', err)
      return false
    }
  }

  // --- Mock mode (development) ---
  console.log(`[Email Mock] To: ${payload.to} | Subject: ${payload.subject} | Body: ${payload.body}`)
  return true
}

function buildEmailHtml(payload: EmailPayload): string {
  const linkButton = payload.link
    ? `<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${payload.link}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">View Details</a>`
    : ''

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#16a34a;font-size:24px;margin:0;">HustleKE</h1>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Kenya's Freelance Marketplace</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
        <h2 style="color:#111827;font-size:18px;margin:0 0 8px;">${payload.subject}</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">Hi ${payload.name},</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">${payload.body}</p>
        ${linkButton}
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:24px;">
        You received this because you have notifications enabled on HustleKE.<br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?tab=notifications" style="color:#6b7280;">Manage notification preferences</a>
      </p>
    </div>
  `
}

// ============================================
// SMS NOTIFICATIONS
// ============================================

interface SmsPayload {
  to: string
  message: string
  type: NotificationType
}

/**
 * Send an SMS notification.
 * 
 * Supports two providers (set env vars to enable):
 * 1. Africa's Talking: Set AT_API_KEY, AT_USERNAME, AT_SENDER_ID
 * 2. Twilio: Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * 
 * Falls back to console.log in development if no SMS provider is configured.
 */
async function sendSmsNotification(payload: SmsPayload): Promise<boolean> {
  const phone = formatKenyanPhone(payload.to)
  if (!phone) {
    console.warn(`[SMS] Invalid phone number: ${payload.to}`)
    return false
  }

  const atApiKey = process.env.AT_API_KEY
  const twilioSid = process.env.TWILIO_ACCOUNT_SID

  // --- Africa's Talking ---
  if (atApiKey) {
    try {
      const username = process.env.AT_USERNAME || 'sandbox'
      const senderId = process.env.AT_SENDER_ID || 'HustleKE'

      const params = new URLSearchParams({
        username,
        to: phone,
        message: payload.message,
        from: senderId,
      })

      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': atApiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      })

      if (res.ok) {
        const data = await res.json()
        console.log(`[SMS] AT sent to ${phone}:`, data)
        return true
      }
      const err = await res.text()
      console.error('[SMS] AT error:', err)
      return false
    } catch (err) {
      console.error('[SMS] AT send error:', err)
      return false
    }
  }

  // --- Twilio ---
  if (twilioSid) {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const fromNumber = process.env.TWILIO_PHONE_NUMBER

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${twilioSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: fromNumber || '',
            Body: payload.message,
          }).toString(),
        }
      )

      if (res.ok) {
        console.log(`[SMS] Twilio sent to ${phone}`)
        return true
      }
      const err = await res.text()
      console.error('[SMS] Twilio error:', err)
      return false
    } catch (err) {
      console.error('[SMS] Twilio send error:', err)
      return false
    }
  }

  // --- Mock mode (development) ---
  console.log(`[SMS Mock] To: ${phone} | Message: ${payload.message}`)
  return true
}

/**
 * Format a Kenyan phone number to international format (+254...).
 */
function formatKenyanPhone(phone: string): string | null {
  if (!phone) return null
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  if (cleaned.startsWith('+254') && cleaned.length === 13) return cleaned
  if (cleaned.startsWith('254') && cleaned.length === 12) return `+${cleaned}`
  if (cleaned.startsWith('0') && cleaned.length === 10) return `+254${cleaned.slice(1)}`
  if (cleaned.startsWith('7') && cleaned.length === 9) return `+254${cleaned}`
  if (cleaned.startsWith('1') && cleaned.length === 9) return `+254${cleaned}`

  return null // Invalid format
}

// ============================================
// USER PREFERENCES
// ============================================

async function getUserPreferences(
  adminDb: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data } = await adminDb
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) return data as UserPreferences

  // Create default preferences if none exist
  try {
    await adminDb.from('notification_preferences').insert({
      user_id: userId,
      ...DEFAULT_PREFERENCES,
    })
  } catch {} // Ignore duplicate insert errors

  return DEFAULT_PREFERENCES
}

// ============================================
// CONVENIENCE HELPERS
// ============================================

/** Notify when a proposal is accepted */
export async function notifyProposalAccepted(
  adminDb: SupabaseClient,
  freelancerId: string,
  jobTitle: string,
  jobId: string
) {
  return sendNotification(adminDb, {
    userId: freelancerId,
    type: 'hire',
    title: "You're Hired!",
    message: `Your proposal for "${jobTitle}" has been accepted! Check your messages to coordinate with the client.`,
    link: `/dashboard/messages?job_id=${jobId}`,
  })
}

/** Notify when a proposal is rejected */
export async function notifyProposalRejected(
  adminDb: SupabaseClient,
  freelancerId: string,
  jobTitle: string
) {
  return sendNotification(adminDb, {
    userId: freelancerId,
    type: 'rejection',
    title: 'Proposal Update',
    message: `Your proposal for "${jobTitle}" was not selected. Keep applying — your next opportunity is around the corner!`,
    link: '/dashboard/proposals',
  })
}

/** Notify client of a new proposal */
export async function notifyNewProposal(
  adminDb: SupabaseClient,
  clientId: string,
  freelancerName: string,
  jobTitle: string
) {
  return sendNotification(adminDb, {
    userId: clientId,
    type: 'proposal',
    title: 'New Proposal',
    message: `${freelancerName} submitted a proposal for "${jobTitle}". Review their profile and decide.`,
    link: '/dashboard/projects',
  })
}

/** Notify freelancer of escrow release */
export async function notifyEscrowReleased(
  adminDb: SupabaseClient,
  freelancerId: string,
  amount: number,
  jobTitle: string
) {
  return sendNotification(adminDb, {
    userId: freelancerId,
    type: 'escrow',
    title: 'Payment Released!',
    message: `KES ${amount.toLocaleString()} has been released to your wallet for "${jobTitle}". Great work!`,
    link: '/dashboard/wallet',
  })
}

/** Notify about subscription events */
export async function notifySubscriptionEvent(
  adminDb: SupabaseClient,
  userId: string,
  event: 'subscribed' | 'renewed' | 'cancelled' | 'expiring' | 'expired' | 'low_balance',
  details?: { planName?: string; expiryDate?: string; balance?: number; price?: number; daysLeft?: number }
) {
  const messages: Record<string, { title: string; message: string; link: string }> = {
    subscribed: {
      title: 'Welcome to Pro!',
      message: `You're now on the ${details?.planName || 'Pro'} plan. Enjoy reduced fees, priority matching, and more!`,
      link: '/dashboard/settings?tab=subscription',
    },
    renewed: {
      title: 'Subscription Renewed',
      message: `Your ${details?.planName || 'Pro'} plan has been auto-renewed. KES ${details?.price || 500} was charged from your wallet.`,
      link: '/dashboard/settings?tab=subscription',
    },
    cancelled: {
      title: 'Subscription Cancelled',
      message: `Your ${details?.planName || 'Pro'} plan has been cancelled. Benefits continue until ${details?.expiryDate || 'the end of your billing period'}.`,
      link: '/dashboard/settings?tab=subscription',
    },
    expiring: {
      title: 'Subscription Expiring Soon',
      message: `Your ${details?.planName || 'Pro'} plan expires in ${details?.daysLeft || 3} day(s). Ensure your wallet has KES ${details?.price || 500} for auto-renewal.`,
      link: '/dashboard/wallet',
    },
    expired: {
      title: 'Subscription Expired',
      message: `Your ${details?.planName || 'Pro'} plan has expired and could not be auto-renewed. You've been moved to the Free plan. Re-subscribe anytime.`,
      link: '/dashboard/settings?tab=subscription',
    },
    low_balance: {
      title: 'Wallet Balance Low',
      message: `Your wallet balance (KES ${details?.balance || 0}) is insufficient for subscription renewal (KES ${details?.price || 500}). Top up to keep your Pro benefits.`,
      link: '/dashboard/wallet',
    },
  }

  const msg = messages[event]
  if (!msg) return

  return sendNotification(adminDb, {
    userId,
    type: 'subscription',
    title: msg.title,
    message: msg.message,
    link: msg.link,
  })
}

/** Notify about new message */
export async function notifyNewMessage(
  adminDb: SupabaseClient,
  receiverId: string,
  senderName: string,
  jobTitle: string,
  jobId: string
) {
  return sendNotification(adminDb, {
    userId: receiverId,
    type: 'message',
    title: 'New Message',
    message: `${senderName} sent you a message on "${jobTitle}".`,
    link: `/dashboard/messages?job_id=${jobId}`,
  })
}

/** Notify work submission */
export async function notifyWorkSubmitted(
  adminDb: SupabaseClient,
  clientId: string,
  freelancerName: string,
  jobTitle: string
) {
  return sendNotification(adminDb, {
    userId: clientId,
    type: 'submission',
    title: 'Work Submitted',
    message: `${freelancerName} submitted work for "${jobTitle}" — ready for your review.`,
    link: '/dashboard/projects',
  })
}

/** Notify revision request */
export async function notifyRevisionRequested(
  adminDb: SupabaseClient,
  freelancerId: string,
  clientName: string,
  jobTitle: string,
  jobId: string
) {
  return sendNotification(adminDb, {
    userId: freelancerId,
    type: 'revision',
    title: 'Revision Requested',
    message: `${clientName} requested revisions on "${jobTitle}". Check the details and resubmit.`,
    link: `/dashboard/messages?job_id=${jobId}`,
  })
}

/** Notify user of an organization invite */
export async function notifyOrgInvite(
  adminDb: SupabaseClient,
  recipientProfileId: string,
  orgName: string,
  role: string,
  inviterName: string
) {
  return sendNotification(adminDb, {
    userId: recipientProfileId,
    type: 'info',
    title: `Organization Invite: ${orgName}`,
    message: `${inviterName} invited you to join "${orgName}" as ${role}. Go to your dashboard and use the context switcher in the sidebar to accept or decline.`,
    link: '/dashboard',
    metadata: { org_invite: true, org_name: orgName, role },
  })
}
