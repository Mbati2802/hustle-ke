import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/api-utils'

// GET /api/trustchain — Get reputation data
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'my-reputation'

  // Get user's full reputation profile
  if (action === 'my-reputation') {
    const [imports, certificate, verifiedSkills, reviews] = await Promise.all([
      auth.adminDb.from('reputation_imports').select('*').eq('user_id', auth.profile.id),
      auth.adminDb.from('reputation_certificates').select('*').eq('user_id', auth.profile.id).order('created_at', { ascending: false }).limit(1).single(),
      auth.adminDb.from('verified_skills').select('*').eq('user_id', auth.profile.id),
      auth.adminDb.from('reviews').select('rating, comment, created_at').eq('reviewee_id', auth.profile.id),
    ])

    // Calculate TrustChain score
    const trustScore = calculateTrustScore(
      auth.profile,
      imports.data || [],
      verifiedSkills.data || [],
      reviews.data || []
    )

    return jsonResponse({
      imports: imports.data || [],
      certificate: certificate.data || null,
      verifiedSkills: verifiedSkills.data || [],
      trustScore,
      profile: {
        hustle_score: auth.profile.hustle_score,
        jobs_completed: auth.profile.jobs_completed,
        trust_chain_score: (auth.profile as any).trust_chain_score,
      },
    })
  }

  // Get public certificate by short code
  if (action === 'certificate') {
    const code = url.searchParams.get('code')
    if (!code) return errorResponse('code required', 400)

    const { data: cert } = await auth.adminDb
      .from('reputation_certificates')
      .select('*')
      .eq('short_code', code.toUpperCase())
      .eq('is_public', true)
      .single()

    if (!cert) return errorResponse('Certificate not found', 404)

    // Increment views
    await auth.adminDb
      .from('reputation_certificates')
      .update({ views: (cert.views || 0) + 1 })
      .eq('id', cert.id)

    return jsonResponse({ certificate: cert })
  }

  // Get public reputation for a user
  if (action === 'public') {
    const userId = url.searchParams.get('user_id')
    if (!userId) return errorResponse('user_id required', 400)

    const [imports, skills, cert] = await Promise.all([
      auth.adminDb.from('reputation_imports').select('platform, rating, total_reviews, total_projects, verification_status, verified_at')
        .eq('user_id', userId).eq('verification_status', 'verified'),
      auth.adminDb.from('verified_skills').select('skill_name, badge_level, score, verified_at').eq('user_id', userId),
      auth.adminDb.from('reputation_certificates').select('short_code, total_projects, avg_rating, on_time_rate, skills_verified, hustle_score, created_at')
        .eq('user_id', userId).eq('is_public', true).order('created_at', { ascending: false }).limit(1).single(),
    ])

    return jsonResponse({
      imports: imports.data || [],
      verifiedSkills: skills.data || [],
      certificate: cert.data || null,
    })
  }

  return jsonResponse({ actions: ['my-reputation', 'certificate', 'public'] })
}

// POST /api/trustchain — Import reputation, generate certificate
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth

  const body = await parseBody<{
    action: string
    platform?: string
    platform_profile_url?: string
    platform_username?: string
    rating?: number
    total_reviews?: number
    total_projects?: number
    verification_method?: string
    screenshot_url?: string
  }>(req)

  if (!body?.action) return errorResponse('Action required', 400)

  // Import reputation from external platform
  if (body.action === 'import') {
    const { platform, platform_profile_url, platform_username, rating, total_reviews, total_projects, verification_method, screenshot_url } = body

    if (!platform || !platform_profile_url) {
      return errorResponse('platform and platform_profile_url required', 400)
    }

    // Validate platform
    const validPlatforms = ['upwork', 'fiverr', 'freelancer', 'linkedin', 'github', 'toptal', 'other']
    if (!validPlatforms.includes(platform)) {
      return errorResponse(`Invalid platform. Use: ${validPlatforms.join(', ')}`, 400)
    }

    // Check if already imported
    const { data: existing } = await auth.adminDb
      .from('reputation_imports')
      .select('id, verification_status')
      .eq('user_id', auth.profile.id)
      .eq('platform', platform)
      .single()

    if (existing && existing.verification_status === 'verified') {
      return errorResponse('This platform is already verified. Delete it first to re-import.', 409)
    }

    // Calculate trust score contribution
    const trustContribution = calculateImportContribution(rating || 0, total_reviews || 0, total_projects || 0)

    const importData = {
      user_id: auth.profile.id,
      platform,
      platform_profile_url,
      platform_username: platform_username || null,
      rating: rating || null,
      total_reviews: total_reviews || 0,
      total_projects: total_projects || 0,
      verification_method: verification_method || 'screenshot',
      verification_proof: screenshot_url ? { screenshot_url } : {},
      verification_status: 'pending' as const,
      trust_score_contribution: trustContribution,
    }

    let result
    if (existing) {
      const { data, error } = await auth.adminDb
        .from('reputation_imports')
        .update(importData)
        .eq('id', existing.id)
        .select('*')
        .single()
      result = { data, error }
    } else {
      const { data, error } = await auth.adminDb
        .from('reputation_imports')
        .insert(importData)
        .select('*')
        .single()
      result = { data, error }
    }

    if (result.error) {
      console.error('Import error:', result.error)
      return errorResponse('Failed to save import', 500)
    }

    // Auto-verify if screenshot provided (simplified — in production would use AI verification)
    if (screenshot_url && rating && total_reviews) {
      await auth.adminDb
        .from('reputation_imports')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: 'ai',
        })
        .eq('id', result.data.id)

      // Update profile trust chain score
      await updateTrustChainScore(auth.adminDb, auth.profile.id)
    }

    return jsonResponse({
      import: result.data,
      trust_contribution: trustContribution,
      status: screenshot_url ? 'verified' : 'pending',
    })
  }

  // Generate reputation certificate
  if (body.action === 'generate-certificate') {
    // Gather all reputation data
    const [imports, skills, reviews, profile] = await Promise.all([
      auth.adminDb.from('reputation_imports').select('*').eq('user_id', auth.profile.id).eq('verification_status', 'verified'),
      auth.adminDb.from('verified_skills').select('*').eq('user_id', auth.profile.id),
      auth.adminDb.from('reviews').select('rating').eq('reviewee_id', auth.profile.id),
      auth.adminDb.from('profiles').select('hustle_score, jobs_completed, full_name').eq('id', auth.profile.id).single(),
    ])

    const avgRating = (reviews.data || []).length > 0
      ? Math.round(((reviews.data || []).reduce((s, r) => s + (r.rating || 0), 0) / (reviews.data || []).length) * 100) / 100
      : 0

    const totalProjects = (profile.data?.jobs_completed || 0) +
      (imports.data || []).reduce((s, i) => s + (i.total_projects || 0), 0)

    // Generate short code
    const shortCode = `HK-${generateShortCode()}`

    // Build certificate data (JSON-LD format)
    const certificateData = {
      '@context': 'https://schema.org',
      '@type': 'DigitalDocument',
      name: `HustleKE TrustChain Certificate`,
      description: `Verified reputation certificate for ${profile.data?.full_name || 'Freelancer'}`,
      creator: { '@type': 'Organization', name: 'HustleKE', url: 'https://hustlekenya.onrender.com' },
      dateCreated: new Date().toISOString(),
      identifier: shortCode,
      subject: {
        name: profile.data?.full_name,
        hustleScore: profile.data?.hustle_score || 0,
        totalProjects,
        avgRating,
        skillsVerified: (skills.data || []).length,
        verifiedPlatforms: (imports.data || []).map(i => ({
          platform: i.platform,
          rating: i.rating,
          reviews: i.total_reviews,
          projects: i.total_projects,
        })),
        verifiedSkills: (skills.data || []).map(s => ({
          skill: s.skill_name,
          level: s.badge_level,
          score: s.score,
        })),
      },
    }

    // Create signature hash (HMAC-like using simple hash)
    const signatureInput = JSON.stringify(certificateData) + (process.env.SUPABASE_SERVICE_ROLE_KEY || 'secret')
    const signatureHash = await hashString(signatureInput)

    // Determine earnings tier
    const earningsTier = totalProjects > 50 ? '100k_plus' : totalProjects > 20 ? '50k_100k' : totalProjects > 5 ? '10k_50k' : totalProjects > 0 ? '1k_10k' : 'under_1k'

    const { data: cert, error } = await auth.adminDb
      .from('reputation_certificates')
      .upsert({
        user_id: auth.profile.id,
        certificate_data: certificateData,
        signature_hash: signatureHash,
        total_projects: totalProjects,
        avg_rating: avgRating,
        on_time_rate: 95, // Default — would calculate from actual data
        skills_verified: (skills.data || []).length,
        earnings_tier: earningsTier,
        hustle_score: profile.data?.hustle_score || 0,
        short_code: shortCode,
        is_public: true,
        version: 1,
      }, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      console.error('Certificate error:', error)
      return errorResponse('Failed to generate certificate', 500)
    }

    return jsonResponse({ certificate: cert })
  }

  // Delete an import
  if (body.action === 'delete-import') {
    const importId = (body as Record<string, unknown>).import_id as string
    if (!importId) return errorResponse('import_id required', 400)

    await auth.adminDb
      .from('reputation_imports')
      .delete()
      .eq('id', importId)
      .eq('user_id', auth.profile.id)

    await updateTrustChainScore(auth.adminDb, auth.profile.id)

    return jsonResponse({ success: true })
  }

  return errorResponse('Invalid action', 400)
}

// Helper: Calculate trust score contribution from an import
function calculateImportContribution(rating: number, reviews: number, projects: number): number {
  let score = 0
  // Rating contribution (max 30 points)
  if (rating > 0) score += Math.min(30, rating * 6)
  // Review volume (max 20 points)
  score += Math.min(20, reviews * 0.2)
  // Project count (max 15 points)
  score += Math.min(15, projects * 0.3)
  return Math.round(score * 100) / 100
}

// Helper: Calculate overall TrustChain score
function calculateTrustScore(
  profile: { hustle_score?: number; jobs_completed?: number },
  imports: Array<{ trust_score_contribution?: number; verification_status?: string }>,
  verifiedSkills: Array<{ badge_level?: string }>,
  reviews: Array<{ rating?: number }>
): number {
  let score = 0

  // Internal reputation (max 40 points)
  score += Math.min(20, (profile.hustle_score || 0) * 0.2)
  score += Math.min(10, (profile.jobs_completed || 0) * 0.5)
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0
  score += Math.min(10, avgRating * 2)

  // External reputation (max 35 points)
  const verifiedImports = imports.filter(i => i.verification_status === 'verified')
  for (const imp of verifiedImports) {
    score += Math.min(35, imp.trust_score_contribution || 0)
  }

  // Verified skills (max 25 points)
  for (const skill of verifiedSkills) {
    switch (skill.badge_level) {
      case 'diamond': score += 6; break
      case 'gold': score += 4; break
      case 'silver': score += 2; break
      case 'bronze': score += 1; break
    }
  }
  score = Math.min(score, 100)

  return Math.round(score * 100) / 100
}

// Helper: Update profile's trust chain score
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateTrustChainScore(adminDb: any, userId: string) {
  const [imports, skills, reviews, profile] = await Promise.all([
    adminDb.from('reputation_imports').select('trust_score_contribution, verification_status').eq('user_id', userId),
    adminDb.from('verified_skills').select('badge_level').eq('user_id', userId),
    adminDb.from('reviews').select('rating').eq('reviewee_id', userId),
    adminDb.from('profiles').select('hustle_score, jobs_completed').eq('id', userId).single(),
  ])

  const trustScore = calculateTrustScore(
    profile.data || {},
    imports.data || [],
    skills.data || [],
    reviews.data || []
  )

  await adminDb
    .from('profiles')
    .update({ trust_chain_score: trustScore })
    .eq('id', userId)
}

// Helper: Generate short code
function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Helper: Simple string hash (Edge-compatible)
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
