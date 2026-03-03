import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/cron/auto-release — Auto-release escrow after deadline
// Called by external cron service (e.g., Render cron, Vercel cron, or cron-job.org)
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminDb = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()

  // Find escrows past their auto-release deadline
  const { data: dueEscrows, error } = await adminDb
    .from('escrow_transactions')
    .select('id, job_id, client_id, freelancer_id, amount, service_fee')
    .eq('status', 'Held')
    .not('auto_release_at', 'is', null)
    .lte('auto_release_at', now)
    .limit(50)

  if (error) {
    console.error('[Auto-Release] Query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  if (!dueEscrows || dueEscrows.length === 0) {
    return NextResponse.json({ released: 0, message: 'No escrows due for auto-release' })
  }

  let released = 0
  const errors: string[] = []

  for (const escrow of dueEscrows) {
    try {
      // Release escrow — update status
      const { error: updateErr } = await adminDb
        .from('escrow_transactions')
        .update({ status: 'Released', released_at: now })
        .eq('id', escrow.id)

      if (updateErr) {
        errors.push(`Escrow ${escrow.id}: ${updateErr.message}`)
        continue
      }

      // Credit freelancer wallet
      const netAmount = escrow.amount - (escrow.service_fee || 0)
      const { data: wallet } = await adminDb
        .from('wallets')
        .select('id, balance')
        .eq('user_id', escrow.freelancer_id)
        .single()

      if (wallet) {
        await adminDb
          .from('wallets')
          .update({ balance: wallet.balance + netAmount })
          .eq('id', wallet.id)

        await adminDb.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          type: 'Escrow Release',
          amount: netAmount,
          description: `Auto-released escrow payment (deadline passed)`,
          status: 'Completed',
          reference_id: escrow.id,
        })
      }

      // Notify freelancer
      await adminDb.from('notifications').insert({
        user_id: escrow.freelancer_id,
        title: 'Payment Auto-Released',
        message: `KES ${netAmount.toLocaleString()} has been automatically released to your wallet. The client did not respond within the review deadline.`,
        type: 'escrow',
        link: '/dashboard/wallet',
      })

      // Notify client
      await adminDb.from('notifications').insert({
        user_id: escrow.client_id,
        title: 'Escrow Auto-Released',
        message: `Escrow of KES ${escrow.amount.toLocaleString()} was auto-released to the freelancer because the review deadline passed without action.`,
        type: 'escrow',
        link: '/dashboard/escrow',
      })

      // Update job status to Completed
      if (escrow.job_id) {
        await adminDb
          .from('jobs')
          .update({ status: 'Completed', completed_at: now })
          .eq('id', escrow.job_id)
          .in('status', ['Review', 'In-Progress'])
      }

      released++
    } catch (err) {
      errors.push(`Escrow ${escrow.id}: ${String(err)}`)
    }
  }

  return NextResponse.json({
    released,
    total_due: dueEscrows.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// Also support GET for simple cron services
export async function GET(req: NextRequest) {
  return POST(req)
}
