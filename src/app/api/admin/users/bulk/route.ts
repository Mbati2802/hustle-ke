import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

interface BulkActionBody {
  action: 'ban' | 'unban' | 'verify' | 'unverify' | 'delete'
  user_ids: string[]
  reason?: string
}

// POST /api/admin/users/bulk — Bulk user actions
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<BulkActionBody>(req)
  if (!body) return errorResponse('Invalid request body')
  if (!body.action || !body.user_ids || !Array.isArray(body.user_ids)) {
    return errorResponse('action and user_ids are required')
  }
  if (body.user_ids.length === 0) {
    return errorResponse('user_ids cannot be empty')
  }
  if (body.user_ids.length > 100) {
    return errorResponse('Cannot process more than 100 users at once')
  }

  const { action, user_ids, reason } = body
  const results = { success: 0, failed: 0, errors: [] as string[] }

  try {
    switch (action) {
      case 'ban':
        // Update profiles to banned status
        const { error: banError } = await auth.adminDb
          .from('profiles')
          .update({ 
            is_banned: true,
            ban_reason: reason || 'Banned by admin',
            banned_at: new Date().toISOString(),
            banned_by: auth.profile.id
          })
          .in('id', user_ids)
        
        if (banError) {
          results.errors.push(`Ban failed: ${banError.message}`)
        } else {
          results.success = user_ids.length
        }
        break

      case 'unban':
        const { error: unbanError } = await auth.adminDb
          .from('profiles')
          .update({ 
            is_banned: false,
            ban_reason: null,
            banned_at: null,
            banned_by: null
          })
          .in('id', user_ids)
        
        if (unbanError) {
          results.errors.push(`Unban failed: ${unbanError.message}`)
        } else {
          results.success = user_ids.length
        }
        break

      case 'verify':
        const { error: verifyError } = await auth.adminDb
          .from('profiles')
          .update({ 
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: auth.profile.id
          })
          .in('id', user_ids)
        
        if (verifyError) {
          results.errors.push(`Verify failed: ${verifyError.message}`)
        } else {
          results.success = user_ids.length
        }
        break

      case 'unverify':
        const { error: unverifyError } = await auth.adminDb
          .from('profiles')
          .update({ 
            verification_status: 'unverified',
            verified_at: null,
            verified_by: null
          })
          .in('id', user_ids)
        
        if (unverifyError) {
          results.errors.push(`Unverify failed: ${unverifyError.message}`)
        } else {
          results.success = user_ids.length
        }
        break

      case 'delete':
        // Soft delete - mark as deleted but keep data for audit
        const { error: deleteError } = await auth.adminDb
          .from('profiles')
          .update({ 
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: auth.profile.id,
            delete_reason: reason || 'Deleted by admin'
          })
          .in('id', user_ids)
        
        if (deleteError) {
          results.errors.push(`Delete failed: ${deleteError.message}`)
        } else {
          results.success = user_ids.length
        }
        break

      default:
        return errorResponse('Invalid action')
    }

    // Log activity
    await auth.adminDb.from('activity_log').insert({
      admin_id: auth.profile.id,
      action: `bulk_${action}`,
      entity_type: 'users',
      details: {
        user_ids,
        reason,
        results
      }
    })

    return jsonResponse({
      message: `Bulk ${action} completed`,
      results
    })
  } catch (error) {
    console.error('[Admin Bulk Action] Error:', error)
    return errorResponse('Failed to perform bulk action', 500)
  }
}
