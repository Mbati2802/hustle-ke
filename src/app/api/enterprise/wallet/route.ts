import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'
import { initiateSTKPush, isValidKenyanPhone, formatPhoneNumber } from '@/lib/mpesa'

// Helper: get user's org + role
async function getOrgForUser(auth: any) {
  const { data: ownedOrg } = await auth.supabase
    .from('organizations')
    .select('id, name, owner_id')
    .eq('owner_id', auth.profile.id)
    .eq('is_active', true)
    .maybeSingle()
  if (ownedOrg) return { org: ownedOrg, role: 'owner' }

  const { data: membership } = await auth.supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, owner_id)')
    .eq('user_id', auth.profile.id)
    .limit(1)
    .maybeSingle()
  if (membership?.organizations) return { org: membership.organizations as any, role: membership.role }
  return null
}

// GET /api/enterprise/wallet — Get org wallet balance + recent transactions
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const orgInfo = await getOrgForUser(auth)
    if (!orgInfo) return errorResponse('No organization found', 404)

    // Get or auto-create org wallet
    let { data: wallet } = await auth.adminDb
      .from('organization_wallets')
      .select('*')
      .eq('organization_id', orgInfo.org.id)
      .maybeSingle()

    if (!wallet) {
      const { data: newWallet, error: createErr } = await auth.adminDb
        .from('organization_wallets')
        .insert({ organization_id: orgInfo.org.id })
        .select()
        .single()
      if (createErr) {
        console.error('[Org Wallet GET] create error:', createErr)
        return errorResponse('Failed to create org wallet', 500)
      }
      wallet = newWallet
    }

    // Get recent transactions
    const url = new URL(req.url)
    const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'))
    const { data: transactions } = await auth.adminDb
      .from('organization_wallet_transactions')
      .select('*, performed_by_profile:performed_by(full_name, avatar_url)')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    return jsonResponse({
      wallet,
      transactions: transactions || [],
      role: orgInfo.role,
      is_admin: ['owner', 'admin'].includes(orgInfo.role),
    })
  } catch (err) {
    console.error('[Org Wallet GET]', err)
    return errorResponse('Failed to fetch org wallet', 500)
  }
}

// POST /api/enterprise/wallet — Top-up or withdraw (admin/owner only)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    const orgInfo = await getOrgForUser(auth)
    if (!orgInfo) return errorResponse('No organization found', 404)
    if (!['owner', 'admin'].includes(orgInfo.role)) {
      return errorResponse('Only organization owners and admins can manage the wallet')
    }

    const body = await parseBody<{ action: string; amount: number; phone?: string; description?: string }>(req)
    if (!body || !body.action) return errorResponse('action is required')

    // Get wallet
    let { data: wallet } = await auth.adminDb
      .from('organization_wallets')
      .select('*')
      .eq('organization_id', orgInfo.org.id)
      .maybeSingle()

    if (!wallet) {
      const { data: newWallet } = await auth.adminDb
        .from('organization_wallets')
        .insert({ organization_id: orgInfo.org.id })
        .select()
        .single()
      wallet = newWallet
    }

    if (!wallet) return errorResponse('Failed to get org wallet', 500)

    if (body.action === 'deposit') {
      const amount = Math.round(body.amount || 0)
      if (amount < 10) return errorResponse('Minimum deposit is KES 10')
      if (amount > 500000) return errorResponse('Maximum deposit is KES 500,000')

      if (!body.phone || !isValidKenyanPhone(body.phone)) {
        return errorResponse('Valid phone number is required (07XXXXXXXX or 254XXXXXXXXX)')
      }
      const phone = formatPhoneNumber(body.phone)

      // Initiate STK push
      const result = await initiateSTKPush(
        phone,
        amount,
        `HustleKE-Org-${orgInfo.org.id.slice(0, 8)}`,
        `Org wallet top-up for ${orgInfo.org.name}`
      )

      if (!result.success) {
        return errorResponse(result.error || 'Failed to initiate payment', 500)
      }

      // Record transaction
      const { data: tx } = await auth.adminDb
        .from('organization_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount,
          type: 'Deposit',
          status: result.mock ? 'Completed' : 'Pending',
          performed_by: auth.profile.id,
          mpesa_phone: phone,
          description: `M-Pesa deposit${result.mock ? ' (mock)' : ''} by ${auth.profile.full_name}`,
          metadata: {
            checkout_request_id: result.checkoutRequestId,
            merchant_request_id: result.merchantRequestId,
            mock: result.mock || false,
          },
        })
        .select()
        .single()

      // In mock mode, credit immediately
      if (result.mock) {
        await auth.adminDb
          .from('organization_wallets')
          .update({
            balance: wallet.balance + amount,
            total_deposited: wallet.total_deposited + amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id)
      }

      // Log activity
      await auth.adminDb.from('organization_activity_log').insert({
        organization_id: orgInfo.org.id,
        user_id: auth.profile.id,
        action: 'wallet_deposit',
        entity_type: 'payment',
        entity_id: tx?.id,
        details: { amount, phone, mock: result.mock },
      })

      return jsonResponse({
        success: true,
        message: result.mock
          ? `Mock deposit of KES ${amount.toLocaleString()} credited instantly.`
          : `STK push sent to ${phone}. Enter M-Pesa PIN to complete.`,
        mock: result.mock || false,
        transaction_id: tx?.id,
      })
    }

    if (body.action === 'withdraw') {
      const amount = Math.round(body.amount || 0)
      if (amount < 100) return errorResponse('Minimum withdrawal is KES 100')
      if (amount > wallet.balance) {
        return errorResponse(`Insufficient balance. Available: KES ${wallet.balance.toLocaleString()}`)
      }

      if (!body.phone || !isValidKenyanPhone(body.phone)) {
        return errorResponse('Valid phone number is required')
      }
      const phone = formatPhoneNumber(body.phone)

      // Debit wallet
      await auth.adminDb
        .from('organization_wallets')
        .update({
          balance: wallet.balance - amount,
          total_withdrawn: wallet.total_withdrawn + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      // Record transaction
      const { data: tx } = await auth.adminDb
        .from('organization_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          amount: -amount,
          type: 'Withdrawal',
          status: 'Completed',
          performed_by: auth.profile.id,
          mpesa_phone: phone,
          description: `Withdrawal to ${phone} by ${auth.profile.full_name}`,
        })
        .select()
        .single()

      // Log activity
      await auth.adminDb.from('organization_activity_log').insert({
        organization_id: orgInfo.org.id,
        user_id: auth.profile.id,
        action: 'wallet_withdrawal',
        entity_type: 'payment',
        entity_id: tx?.id,
        details: { amount, phone },
      })

      return jsonResponse({
        success: true,
        message: `KES ${amount.toLocaleString()} withdrawal initiated to ${phone}.`,
        transaction_id: tx?.id,
      })
    }

    return errorResponse('Invalid action. Use "deposit" or "withdraw".')
  } catch (err) {
    console.error('[Org Wallet POST]', err)
    return errorResponse('Failed to process wallet action', 500)
  }
}
