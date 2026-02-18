import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'

// GET /api/livehustle — Browse sessions, availability, history
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'browse'

  // Browse available freelancers for LiveHustle
  if (action === 'browse') {
    const skill = url.searchParams.get('skill') || ''
    const maxRate = url.searchParams.get('max_rate') || ''

    let query = auth.adminDb
      .from('live_availability')
      .select(`
        *,
        profile:profiles!user_id(id, full_name, avatar_url, title, hustle_score, jobs_completed)
      `)
      .eq('is_available', true)
      .order('avg_rating', { ascending: false })
      .limit(30)

    if (skill) {
      query = query.contains('skills', [skill])
    }
    if (maxRate) {
      query = query.lte('hourly_rate', parseFloat(maxRate))
    }

    const { data } = await query

    return jsonResponse({ available: data || [] })
  }

  // Get open session requests (for freelancers to accept)
  if (action === 'open-sessions') {
    const { data: sessions } = await auth.adminDb
      .from('live_sessions')
      .select(`
        id, title, description, required_skills, hourly_rate, estimated_duration_minutes, max_budget, created_at,
        client:profiles!client_id(id, full_name, avatar_url, hustle_score)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20)

    return jsonResponse({ sessions: sessions || [] })
  }

  // Get my sessions (both as client and freelancer)
  if (action === 'my-sessions') {
    const [asClient, asFreelancer] = await Promise.all([
      auth.adminDb
        .from('live_sessions')
        .select(`
          *,
          freelancer:profiles!freelancer_id(id, full_name, avatar_url, title)
        `)
        .eq('client_id', auth.profile.id)
        .order('created_at', { ascending: false })
        .limit(20),
      auth.adminDb
        .from('live_sessions')
        .select(`
          *,
          client:profiles!client_id(id, full_name, avatar_url, title)
        `)
        .eq('freelancer_id', auth.profile.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return jsonResponse({
      asClient: asClient.data || [],
      asFreelancer: asFreelancer.data || [],
    })
  }

  // Get a specific session with messages
  if (action === 'session') {
    const sessionId = url.searchParams.get('session_id')
    if (!sessionId) return errorResponse('session_id required', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select(`
        *,
        client:profiles!client_id(id, full_name, avatar_url, title),
        freelancer:profiles!freelancer_id(id, full_name, avatar_url, title)
      `)
      .eq('id', sessionId)
      .single()

    if (!session) return errorResponse('Session not found', 404)

    // Verify participant
    if (session.client_id !== auth.profile.id && session.freelancer_id !== auth.profile.id) {
      return errorResponse('Not a participant in this session', 403)
    }

    const { data: messages } = await auth.adminDb
      .from('live_session_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200)

    return jsonResponse({ session, messages: messages || [] })
  }

  // Get my availability settings
  if (action === 'my-availability') {
    const { data } = await auth.adminDb
      .from('live_availability')
      .select('*')
      .eq('user_id', auth.profile.id)
      .single()

    return jsonResponse({ availability: data || null })
  }

  // Get LiveHustle stats
  if (action === 'stats') {
    const { data: availability } = await auth.adminDb
      .from('live_availability')
      .select('total_sessions, avg_rating, total_earnings')
      .eq('user_id', auth.profile.id)
      .single()

    const { count: activeSessions } = await auth.adminDb
      .from('live_sessions')
      .select('id', { count: 'exact', head: true })
      .or(`client_id.eq.${auth.profile.id},freelancer_id.eq.${auth.profile.id}`)
      .in('status', ['in_progress', 'matched'])

    return jsonResponse({
      stats: {
        totalSessions: availability?.total_sessions || 0,
        avgRating: availability?.avg_rating || 0,
        totalEarnings: availability?.total_earnings || 0,
        activeSessions: activeSessions || 0,
      },
    })
  }

  return jsonResponse({ actions: ['browse', 'open-sessions', 'my-sessions', 'session', 'my-availability', 'stats'] })
}

// POST /api/livehustle — Create sessions, accept, manage
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: string
    session_id?: string
    title?: string
    description?: string
    required_skills?: string[]
    hourly_rate?: number
    estimated_duration_minutes?: number
    max_budget?: number
    // Availability
    is_available?: boolean
    skills?: string[]
    bio?: string
    max_session_hours?: number
    // Messages
    content?: string
    message_type?: string
    file_url?: string
    file_name?: string
    // Ratings
    rating?: number
    review?: string
    // Session control
    actual_duration_minutes?: number
    session_notes?: string
  }>(req)

  if (!body?.action) return errorResponse('Action required', 400)

  // Client creates a LiveHustle session request
  if (body.action === 'create-session') {
    const { title, description, required_skills, hourly_rate, estimated_duration_minutes, max_budget } = body

    if (!title || !hourly_rate || !estimated_duration_minutes) {
      return errorResponse('title, hourly_rate, and estimated_duration_minutes required', 400)
    }

    if (hourly_rate < 100) return errorResponse('Minimum hourly rate is KES 100', 400)
    if (estimated_duration_minutes < 15) return errorResponse('Minimum session is 15 minutes', 400)
    if (estimated_duration_minutes > 480) return errorResponse('Maximum session is 8 hours', 400)

    const calculatedMaxBudget = max_budget || Math.ceil((hourly_rate * estimated_duration_minutes) / 60)

    const { data: session, error } = await auth.adminDb
      .from('live_sessions')
      .insert({
        client_id: auth.profile.id,
        title,
        description: description || null,
        required_skills: required_skills || [],
        hourly_rate,
        estimated_duration_minutes,
        max_budget: calculatedMaxBudget,
        status: 'open',
      })
      .select('*')
      .single()

    if (error) {
      console.error('Session creation error:', error)
      return errorResponse('Failed to create session', 500)
    }

    return jsonResponse({ session })
  }

  // Freelancer accepts a session
  if (body.action === 'accept') {
    const { session_id } = body
    if (!session_id) return errorResponse('session_id required', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('status', 'open')
      .single()

    if (!session) return errorResponse('Session not found or already taken', 404)
    if (session.client_id === auth.profile.id) return errorResponse('Cannot accept your own session', 400)

    const { error } = await auth.adminDb
      .from('live_sessions')
      .update({
        freelancer_id: auth.profile.id,
        status: 'matched',
        matched_at: new Date().toISOString(),
      })
      .eq('id', session_id)
      .eq('status', 'open') // Prevent race condition

    if (error) return errorResponse('Failed to accept session — it may have been taken', 409)

    // Add system message
    await auth.adminDb
      .from('live_session_messages')
      .insert({
        session_id,
        sender_id: auth.profile.id,
        content: `${auth.profile.full_name || 'Freelancer'} has joined the session. Ready to start!`,
        message_type: 'system',
      })

    return jsonResponse({ success: true, message: 'Session accepted! You can now start working.' })
  }

  // Start the session timer
  if (body.action === 'start') {
    const { session_id } = body
    if (!session_id) return errorResponse('session_id required', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('client_id, freelancer_id, status')
      .eq('id', session_id)
      .single()

    if (!session) return errorResponse('Session not found', 404)
    if (session.status !== 'matched') return errorResponse('Session must be in matched state to start', 400)
    if (session.client_id !== auth.profile.id && session.freelancer_id !== auth.profile.id) {
      return errorResponse('Not a participant', 403)
    }

    await auth.adminDb
      .from('live_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', session_id)

    await auth.adminDb
      .from('live_session_messages')
      .insert({
        session_id,
        sender_id: auth.profile.id,
        content: '⏱️ Session timer started!',
        message_type: 'system',
      })

    return jsonResponse({ success: true, started_at: new Date().toISOString() })
  }

  // End the session
  if (body.action === 'end') {
    const { session_id, actual_duration_minutes, session_notes } = body
    if (!session_id) return errorResponse('session_id required', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('*')
      .eq('id', session_id)
      .single()

    if (!session) return errorResponse('Session not found', 404)
    if (session.client_id !== auth.profile.id && session.freelancer_id !== auth.profile.id) {
      return errorResponse('Not a participant', 403)
    }

    // Calculate billing
    const duration = actual_duration_minutes || 
      (session.started_at ? Math.ceil((Date.now() - new Date(session.started_at).getTime()) / 60000) : session.estimated_duration_minutes)
    
    const totalBilled = Math.round((session.hourly_rate * duration) / 60)
    const serviceFeeRate = 0.06 // 6% default, would check user plan
    const serviceFee = Math.round(totalBilled * serviceFeeRate)
    const netPayout = totalBilled - serviceFee

    await auth.adminDb
      .from('live_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        actual_duration_minutes: duration,
        total_billed: totalBilled,
        service_fee: serviceFee,
        net_payout: netPayout,
        session_notes: session_notes || null,
      })
      .eq('id', session_id)

    // Update freelancer's LiveHustle stats
    if (session.freelancer_id) {
      const { data: avail } = await auth.adminDb
        .from('live_availability')
        .select('total_sessions, total_earnings')
        .eq('user_id', session.freelancer_id)
        .single()

      if (avail) {
        await auth.adminDb
          .from('live_availability')
          .update({
            total_sessions: (avail.total_sessions || 0) + 1,
            total_earnings: Number(avail.total_earnings || 0) + netPayout,
          })
          .eq('user_id', session.freelancer_id)
      }
    }

    await auth.adminDb
      .from('live_session_messages')
      .insert({
        session_id,
        sender_id: auth.profile.id,
        content: `✅ Session completed! Duration: ${duration} minutes. Total: KES ${totalBilled.toLocaleString()}`,
        message_type: 'system',
      })

    return jsonResponse({
      success: true,
      billing: { duration, totalBilled, serviceFee, netPayout },
    })
  }

  // Cancel a session
  if (body.action === 'cancel') {
    const { session_id } = body
    if (!session_id) return errorResponse('session_id required', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('client_id, status')
      .eq('id', session_id)
      .single()

    if (!session) return errorResponse('Session not found', 404)
    if (session.client_id !== auth.profile.id) return errorResponse('Only the client can cancel', 403)
    if (!['open', 'matched'].includes(session.status)) return errorResponse('Cannot cancel an active session', 400)

    await auth.adminDb
      .from('live_sessions')
      .update({ status: 'cancelled', ended_at: new Date().toISOString() })
      .eq('id', session_id)

    return jsonResponse({ success: true })
  }

  // Send a message in a session
  if (body.action === 'message') {
    const { session_id, content, message_type, file_url, file_name } = body
    if (!session_id || !content) return errorResponse('session_id and content required', 400)

    // Verify participant
    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('client_id, freelancer_id')
      .eq('id', session_id)
      .single()

    if (!session) return errorResponse('Session not found', 404)
    if (session.client_id !== auth.profile.id && session.freelancer_id !== auth.profile.id) {
      return errorResponse('Not a participant', 403)
    }

    const { data: msg, error } = await auth.adminDb
      .from('live_session_messages')
      .insert({
        session_id,
        sender_id: auth.profile.id,
        content: content.slice(0, 5000),
        message_type: message_type || 'text',
        file_url: file_url || null,
        file_name: file_name || null,
      })
      .select('*')
      .single()

    if (error) return errorResponse('Failed to send message', 500)

    return jsonResponse({ message: msg })
  }

  // Rate a session (post-completion)
  if (body.action === 'rate') {
    const { session_id, rating, review } = body
    if (!session_id || !rating) return errorResponse('session_id and rating required', 400)
    if (rating < 1 || rating > 5) return errorResponse('Rating must be 1-5', 400)

    const { data: session } = await auth.adminDb
      .from('live_sessions')
      .select('client_id, freelancer_id, status')
      .eq('id', session_id)
      .single()

    if (!session) return errorResponse('Session not found', 404)
    if (session.status !== 'completed') return errorResponse('Can only rate completed sessions', 400)

    const isClient = session.client_id === auth.profile.id
    const isFreelancer = session.freelancer_id === auth.profile.id

    if (!isClient && !isFreelancer) return errorResponse('Not a participant', 403)

    const updates: Record<string, unknown> = {}
    if (isClient) {
      updates.client_rating = rating
      updates.client_review = review || null
    } else {
      updates.freelancer_rating = rating
      updates.freelancer_review = review || null
    }

    await auth.adminDb
      .from('live_sessions')
      .update(updates)
      .eq('id', session_id)

    // Update freelancer's avg rating if client rated
    if (isClient && session.freelancer_id) {
      const { data: sessions } = await auth.adminDb
        .from('live_sessions')
        .select('client_rating')
        .eq('freelancer_id', session.freelancer_id)
        .not('client_rating', 'is', null)

      if (sessions && sessions.length > 0) {
        const avgRating = Math.round((sessions.reduce((s, ses) => s + (ses.client_rating || 0), 0) / sessions.length) * 100) / 100
        await auth.adminDb
          .from('live_availability')
          .update({ avg_rating: avgRating })
          .eq('user_id', session.freelancer_id)
      }
    }

    return jsonResponse({ success: true })
  }

  // Set/update availability
  if (body.action === 'set-availability') {
    const { is_available, hourly_rate, skills, bio, max_session_hours } = body

    if (is_available && (!hourly_rate || !skills || skills.length === 0)) {
      return errorResponse('hourly_rate and skills required when setting available', 400)
    }

    const { data: existing } = await auth.adminDb
      .from('live_availability')
      .select('id')
      .eq('user_id', auth.profile.id)
      .single()

    const availData = {
      user_id: auth.profile.id,
      is_available: is_available ?? false,
      hourly_rate: hourly_rate || 500,
      skills: skills || [],
      bio: bio || null,
      max_session_hours: max_session_hours || 4,
      last_active_at: new Date().toISOString(),
    }

    if (existing) {
      await auth.adminDb
        .from('live_availability')
        .update(availData)
        .eq('id', existing.id)
    } else {
      await auth.adminDb
        .from('live_availability')
        .insert(availData)
    }

    return jsonResponse({ success: true, is_available: availData.is_available })
  }

  return errorResponse('Invalid action', 400)
}
