import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'
import { getMFASettings } from '@/lib/mfa-totp'

// GET /api/mfa/status — Get MFA status for current user
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const settings = await getMFASettings(auth.userId)

    if (!settings) {
      return jsonResponse({
        enabled: false,
        backup_codes_remaining: 0,
      })
    }

    const backupCodesRemaining = (settings.backup_codes?.length || 0)

    return jsonResponse({
      enabled: settings.is_enabled,
      verified_at: settings.verified_at,
      backup_codes_remaining: backupCodesRemaining,
      backup_codes_used: settings.backup_codes_used || 0,
    })
  } catch (error) {
    console.error('[MFA Status] Error:', error)
    return errorResponse('Failed to get MFA status', 500)
  }
}
