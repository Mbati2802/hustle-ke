import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse, parseBody } from '@/lib/api-utils'

// GET /api/blocked-users — Get list of blocked users
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const { data: blockedUsers, error } = await auth.supabase
      .from('blocked_users')
      .select(`
        id,
        blocked_id,
        reason,
        created_at,
        blocked:profiles!blocked_id(id, full_name, avatar_url, title)
      `)
      .eq('blocker_id', auth.profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Blocked Users] Get error:', error)
      return errorResponse('Failed to fetch blocked users', 500)
    }

    return jsonResponse({ blocked_users: blockedUsers || [] })
  } catch (error) {
    console.error('[Blocked Users] Get exception:', error)
    return errorResponse('Failed to fetch blocked users', 500)
  }
}

// POST /api/blocked-users — Block a user
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const body = await parseBody<{ blocked_id: string; reason?: string }>(req)
    if (!body) return errorResponse('Invalid request body')

    const { blocked_id, reason } = body

    if (!blocked_id) {
      return errorResponse('blocked_id is required', 400)
    }

    // Prevent self-blocking
    if (blocked_id === auth.profile.id) {
      return errorResponse('You cannot block yourself', 400)
    }

    // Check if already blocked
    const { data: existing } = await auth.supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', auth.profile.id)
      .eq('blocked_id', blocked_id)
      .single()

    if (existing) {
      return errorResponse('User is already blocked', 400)
    }

    // Create block
    const { data, error } = await auth.supabase
      .from('blocked_users')
      .insert({
        blocker_id: auth.profile.id,
        blocked_id,
        reason: reason || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Blocked Users] Block error:', error)
      return errorResponse('Failed to block user', 500)
    }

    return jsonResponse({ message: 'User blocked successfully', block: data })
  } catch (error) {
    console.error('[Blocked Users] Block exception:', error)
    return errorResponse('Failed to block user', 500)
  }
}

// DELETE /api/blocked-users — Unblock a user
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const url = new URL(req.url)
    const blockId = url.searchParams.get('block_id')
    const blockedId = url.searchParams.get('blocked_id')

    if (!blockId && !blockedId) {
      return errorResponse('block_id or blocked_id parameter required', 400)
    }

    let query = auth.supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', auth.profile.id)

    if (blockId) {
      query = query.eq('id', blockId)
    } else if (blockedId) {
      query = query.eq('blocked_id', blockedId)
    }

    const { error } = await query

    if (error) {
      console.error('[Blocked Users] Unblock error:', error)
      return errorResponse('Failed to unblock user', 500)
    }

    return jsonResponse({ message: 'User unblocked successfully' })
  } catch (error) {
    console.error('[Blocked Users] Unblock exception:', error)
    return errorResponse('Failed to unblock user', 500)
  }
}
