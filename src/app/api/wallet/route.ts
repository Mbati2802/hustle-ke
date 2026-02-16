import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/wallet — Get current user's wallet balance
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const { data: wallet, error } = await auth.supabase
    .from('wallets')
    .select('*')
    .eq('user_id', auth.profile.id)
    .single()

  if (error || !wallet) {
    // Auto-create wallet if missing
    const { data: newWallet, error: createError } = await auth.supabase
      .from('wallets')
      .insert({ user_id: auth.profile.id })
      .select()
      .single()

    if (createError) return errorResponse('Failed to retrieve wallet', 500)
    return jsonResponse({ wallet: newWallet })
  }

  return jsonResponse({ wallet })
}
