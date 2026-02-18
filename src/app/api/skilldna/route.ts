import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'
import { evaluateResponse } from '@/lib/skilldna-engine'

// GET /api/skilldna — Get available challenges for a skill, or user's verified skills
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'challenges'
  const skill = url.searchParams.get('skill') || ''

  // Public: get challenges for a skill
  if (action === 'challenges') {
    if (!skill) {
      return errorResponse('Skill parameter required', 400)
    }

    const auth = await requireAuth(req)
    if (auth instanceof Response) return auth

    // Get challenges matching this skill
    const { data: challenges } = await auth.adminDb
      .from('skill_challenges')
      .select('id, skill_name, difficulty, challenge_type, title, description, time_limit_seconds')
      .ilike('skill_name', `%${skill}%`)
      .eq('is_active', true)
      .limit(10)

    // Get user's previous attempts for this skill
    const { data: attempts } = await auth.adminDb
      .from('skill_verifications')
      .select('id, challenge_id, score, badge_level, status, created_at')
      .eq('user_id', auth.profile.id)
      .ilike('skill_name', `%${skill}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get user's current verified badge for this skill
    const { data: verified } = await auth.adminDb
      .from('verified_skills')
      .select('*')
      .eq('user_id', auth.profile.id)
      .ilike('skill_name', `%${skill}%`)
      .single()

    return jsonResponse({
      challenges: challenges || [],
      previousAttempts: attempts || [],
      currentBadge: verified || null,
      canRetake: !attempts?.length || 
        (attempts[0] && new Date(attempts[0].created_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000),
    })
  }

  // Get user's all verified skills
  if (action === 'my-skills') {
    const auth = await requireAuth(req)
    if (auth instanceof Response) return auth

    const { data: skills } = await auth.adminDb
      .from('verified_skills')
      .select('*')
      .eq('user_id', auth.profile.id)
      .order('score', { ascending: false })

    return jsonResponse({ skills: skills || [] })
  }

  // Public: get verified skills for a user profile
  if (action === 'profile') {
    const userId = url.searchParams.get('user_id')
    if (!userId) return errorResponse('user_id required', 400)

    const { data: skills } = await (await import('@/lib/api-utils')).createPublicRouteClient(req).supabase!
      .from('verified_skills')
      .select('skill_name, badge_level, score, verified_at')
      .eq('user_id', userId)
      .order('score', { ascending: false })

    return jsonResponse({ skills: skills || [] })
  }

  // Get all available skill categories
  if (action === 'categories') {
    const auth = await requireAuth(req)
    if (auth instanceof Response) return auth

    const { data: challenges } = await auth.adminDb
      .from('skill_challenges')
      .select('skill_name, difficulty, challenge_type')
      .eq('is_active', true)

    // Group by skill
    const skillMap = new Map<string, { difficulties: Set<string>; types: Set<string> }>()
    for (const c of (challenges || [])) {
      if (!skillMap.has(c.skill_name)) {
        skillMap.set(c.skill_name, { difficulties: new Set(), types: new Set() })
      }
      const entry = skillMap.get(c.skill_name)!
      entry.difficulties.add(c.difficulty)
      entry.types.add(c.challenge_type)
    }

    const categories = Array.from(skillMap.entries()).map(([name, data]) => ({
      skill: name,
      difficulties: Array.from(data.difficulties),
      types: Array.from(data.types),
    }))

    return jsonResponse({ categories })
  }

  return jsonResponse({ actions: ['challenges', 'my-skills', 'profile', 'categories'] })
}

// POST /api/skilldna — Start a challenge or submit a response
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: string
    challenge_id?: string
    response?: string
    time_taken_seconds?: number
  }>(req)

  if (!body?.action) return errorResponse('Action required', 400)

  // Start a challenge — returns the full challenge prompt
  if (body.action === 'start') {
    const challengeId = body.challenge_id
    if (!challengeId) return errorResponse('challenge_id required', 400)

    const { data: challenge } = await auth.adminDb
      .from('skill_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('is_active', true)
      .single()

    if (!challenge) return errorResponse('Challenge not found', 404)

    // Check cooldown (7 days between attempts on same skill)
    const { data: recentAttempt } = await auth.adminDb
      .from('skill_verifications')
      .select('created_at')
      .eq('user_id', auth.profile.id)
      .eq('skill_name', challenge.skill_name)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (recentAttempt) {
      const daysSince = (Date.now() - new Date(recentAttempt.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        return errorResponse(`You can retake this skill challenge in ${Math.ceil(7 - daysSince)} days`, 429)
      }
    }

    return jsonResponse({
      challenge: {
        id: challenge.id,
        skill_name: challenge.skill_name,
        difficulty: challenge.difficulty,
        challenge_type: challenge.challenge_type,
        title: challenge.title,
        description: challenge.description,
        prompt: challenge.prompt,
        time_limit_seconds: challenge.time_limit_seconds,
        evaluation_criteria: challenge.evaluation_criteria,
      },
    })
  }

  // Submit a response
  if (body.action === 'submit') {
    const { challenge_id, response, time_taken_seconds } = body
    if (!challenge_id || !response || !time_taken_seconds) {
      return errorResponse('challenge_id, response, and time_taken_seconds required', 400)
    }

    // Get the challenge
    const { data: challenge } = await auth.adminDb
      .from('skill_challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()

    if (!challenge) return errorResponse('Challenge not found', 404)

    // Evaluate the response
    const evaluation = evaluateResponse(
      response,
      challenge.challenge_type,
      challenge.evaluation_criteria as Array<{ criterion: string; weight: number; description: string }>,
      challenge.title,
      time_taken_seconds,
      challenge.time_limit_seconds
    )

    // Save the verification
    const { data: verification, error: verError } = await auth.adminDb
      .from('skill_verifications')
      .insert({
        user_id: auth.profile.id,
        challenge_id,
        skill_name: challenge.skill_name,
        difficulty: challenge.difficulty,
        response: response.slice(0, 10000),
        time_taken_seconds,
        score: evaluation.score,
        badge_level: evaluation.badgeLevel,
        evaluation_details: {
          criteria_scores: evaluation.criteriaScores,
          feedback: evaluation.overallFeedback,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
        },
        status: 'completed',
        evaluated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (verError) {
      console.error('Failed to save verification:', verError)
      return errorResponse('Failed to save verification', 500)
    }

    // Update or create verified skill (keep the best score)
    const { data: existing } = await auth.adminDb
      .from('verified_skills')
      .select('id, score')
      .eq('user_id', auth.profile.id)
      .eq('skill_name', challenge.skill_name)
      .single()

    if (!existing || evaluation.score > (existing.score || 0)) {
      await auth.adminDb
        .from('verified_skills')
        .upsert({
          id: existing?.id || undefined,
          user_id: auth.profile.id,
          skill_name: challenge.skill_name,
          badge_level: evaluation.badgeLevel,
          score: evaluation.score,
          verification_id: verification.id,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          attempts: (existing ? 2 : 1),
        }, { onConflict: 'user_id,skill_name' })
    }

    return jsonResponse({
      verification_id: verification.id,
      score: evaluation.score,
      badge_level: evaluation.badgeLevel,
      criteria_scores: evaluation.criteriaScores,
      overall_feedback: evaluation.overallFeedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      is_new_best: !existing || evaluation.score > (existing.score || 0),
    })
  }

  return errorResponse('Invalid action. Use "start" or "submit"', 400)
}
