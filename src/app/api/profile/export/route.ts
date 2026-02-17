import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

// GET /api/profile/export — Export all user data (GDPR data portability)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  try {
    // Get user profile
    const { data: profile } = await auth.supabase
      .from('profiles')
      .select('*')
      .eq('id', auth.profile.id)
      .single()

    // Get user's jobs
    const { data: jobs } = await auth.supabase
      .from('jobs')
      .select('*')
      .eq('client_id', auth.profile.id)

    // Get user's proposals
    const { data: proposals } = await auth.supabase
      .from('proposals')
      .select('*')
      .eq('freelancer_id', auth.profile.id)

    // Get user's messages
    const { data: messages } = await auth.supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${auth.profile.id},receiver_id.eq.${auth.profile.id}`)

    // Get user's reviews (given and received)
    const { data: reviewsGiven } = await auth.supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', auth.profile.id)

    const { data: reviewsReceived } = await auth.supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', auth.profile.id)

    // Get user's wallet
    const { data: wallet } = await auth.supabase
      .from('wallets')
      .select('*')
      .eq('user_id', auth.profile.id)
      .single()

    // Get wallet transactions
    const { data: transactions } = await auth.supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet?.id)

    // Get escrow transactions
    const { data: escrowAsClient } = await auth.supabase
      .from('escrow_transactions')
      .select('*')
      .eq('client_id', auth.profile.id)

    const { data: escrowAsFreelancer } = await auth.supabase
      .from('escrow_transactions')
      .select('*')
      .eq('freelancer_id', auth.profile.id)

    // Get disputes
    const { data: disputes } = await auth.supabase
      .from('disputes')
      .select('*')
      .or(`initiator_id.eq.${auth.profile.id},respondent_id.eq.${auth.profile.id}`)

    // Get saved jobs
    const { data: savedJobs } = await auth.supabase
      .from('saved_jobs')
      .select('*')
      .eq('user_id', auth.profile.id)

    // Get saved searches
    const { data: savedSearches } = await auth.supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', auth.profile.id)

    // Get notifications
    const { data: notifications } = await auth.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.profile.id)

    // Get notification preferences
    const { data: notificationPrefs } = await auth.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', auth.profile.id)
      .single()

    // Get subscription
    const { data: subscription } = await auth.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', auth.profile.id)
      .single()

    // Get portfolio
    const { data: portfolioCategories } = await auth.supabase
      .from('portfolio_categories')
      .select('*')
      .eq('user_id', auth.profile.id)

    const { data: portfolioItems } = await auth.supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', auth.profile.id)

    // Get support tickets
    const { data: supportTickets } = await auth.supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', auth.profile.id)

    // Compile all data
    const userData = {
      export_date: new Date().toISOString(),
      user_id: auth.profile.id,
      email: profile?.email || auth.profile.email,
      profile,
      jobs: jobs || [],
      proposals: proposals || [],
      messages: messages || [],
      reviews: {
        given: reviewsGiven || [],
        received: reviewsReceived || [],
      },
      wallet,
      transactions: transactions || [],
      escrow: {
        as_client: escrowAsClient || [],
        as_freelancer: escrowAsFreelancer || [],
      },
      disputes: disputes || [],
      saved_jobs: savedJobs || [],
      saved_searches: savedSearches || [],
      notifications: notifications || [],
      notification_preferences: notificationPrefs,
      subscription,
      portfolio: {
        categories: portfolioCategories || [],
        items: portfolioItems || [],
      },
      support_tickets: supportTickets || [],
    }

    // Log the export request
    await auth.adminDb.from('activity_log').insert({
      admin_id: auth.profile.id,
      action: 'data_export',
      entity_type: 'profile',
      entity_id: auth.profile.id,
      details: { export_date: new Date().toISOString() },
    })

    // Return as downloadable JSON
    return new Response(JSON.stringify(userData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="hustleke-data-export-${auth.profile.id}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('[Profile Export] Error:', error)
    return errorResponse('Failed to export data', 500)
  }
}
