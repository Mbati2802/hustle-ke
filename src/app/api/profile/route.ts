import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, validationErrorResponse, parseBody } from '@/lib/api-utils'
import { validate, profileUpdateSchema } from '@/lib/validation'
import { recalculateHustleScore } from '@/lib/subscription-utils'
import { encryptPhone, safeDecrypt } from '@/lib/encryption'

// GET /api/profile — Get current authenticated user's profile
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  // Decrypt sensitive fields before sending to client
  const profile = { ...auth.profile }
  if (profile.mpesa_phone) {
    profile.mpesa_phone = safeDecrypt(profile.mpesa_phone)
  }

  return jsonResponse({ profile })
}

// PUT /api/profile — Update current user's profile
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<Record<string, unknown>>(body, profileUpdateSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  // Only allow updating fields that are in the schema
  const allowedFields = Object.keys(profileUpdateSchema)
  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (result.data[key] !== undefined) {
      // Encrypt sensitive fields
      if (key === 'mpesa_phone' && result.data[key]) {
        updateData[key] = encryptPhone(result.data[key] as string)
      } else {
        updateData[key] = result.data[key]
      }
    }
  }

  // Debug log
  console.log('[Profile Update] updateData:', updateData)

  if (Object.keys(updateData).length === 0) {
    return errorResponse('No valid fields to update')
  }

  const { data: updated, error } = await auth.supabase
    .from('profiles')
    .update(updateData)
    .eq('id', auth.profile.id)
    .select()
    .single()

  console.log('[Profile Update] Supabase response:', { updated, error })

  if (error) {
    console.error('[Profile Update] Database error:', error)
    return errorResponse('Failed to update profile', 500)
  }

  // Recalculate hustle score if profile completeness fields changed
  const scoreFields = ['bio', 'title', 'skills', 'county']
  if (scoreFields.some(f => f in updateData)) {
    const newScore = await recalculateHustleScore(auth.adminDb, auth.profile.id, 'profile_updated')
    if (updated) updated.hustle_score = newScore
  }

  // Decrypt sensitive fields before sending to client
  if (updated && updated.mpesa_phone) {
    updated.mpesa_phone = safeDecrypt(updated.mpesa_phone)
  }

  return jsonResponse({ profile: updated })
}
