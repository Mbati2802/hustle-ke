import { NextRequest } from 'next/server'
import { requireAuth, jsonResponse, errorResponse } from '@/lib/api-utils'

interface ProfileAnalysis {
  overallScore: number
  sections: {
    name: string
    score: number
    maxScore: number
    status: 'excellent' | 'good' | 'needs_work' | 'missing'
    tips: string[]
  }[]
  suggestedBio: string
  suggestedTitle: string
  suggestedSkills: string[]
  topEarnerComparison: {
    metric: string
    yours: string
    topEarners: string
    gap: 'ahead' | 'on_track' | 'behind'
  }[]
  actionPlan: string[]
}

// GET /api/ai-profile-optimizer — Analyze logged-in user's profile
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  const { profile: rawProfile, supabase } = auth
  const profile = rawProfile as any

  try {
    // Fetch portfolio count
    const { count: portfolioCount } = await supabase
      .from('portfolio_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewee_id', profile.id)

    // Fetch completed jobs count
    const { count: completedJobs } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Completed')

    // Fetch top earners for comparison
    const { data: topFreelancers } = await supabase
      .from('profiles')
      .select('skills, hourly_rate, bio, title, hustle_score, jobs_completed, years_experience, avatar_url')
      .eq('role', 'Freelancer')
      .not('skills', 'is', null)
      .order('hustle_score', { ascending: false })
      .limit(20)

    // Fetch market demand for skill suggestions
    const { data: openJobs } = await supabase
      .from('jobs')
      .select('skills_required')
      .eq('status', 'Open')

    // --- Scoring ---
    const sections: ProfileAnalysis['sections'] = []

    // 1. Basic Info (15 pts)
    let basicScore = 0
    const basicTips: string[] = []
    if (profile.full_name && profile.full_name.length > 3) basicScore += 5
    else basicTips.push('Add your full professional name')
    if (profile.phone) basicScore += 3
    else basicTips.push('Add your phone number for verification')
    if (profile.county) basicScore += 3
    else basicTips.push('Add your county to match local jobs')
    if (profile.avatar_url) basicScore += 4
    else basicTips.push('Upload a professional profile photo — profiles with photos get 2x more views')
    sections.push({
      name: 'Basic Info & Photo',
      score: basicScore,
      maxScore: 15,
      status: basicScore >= 13 ? 'excellent' : basicScore >= 8 ? 'good' : basicScore > 0 ? 'needs_work' : 'missing',
      tips: basicTips,
    })

    // 2. Professional Title (10 pts)
    let titleScore = 0
    const titleTips: string[] = []
    if (profile.title) {
      titleScore += 5
      if (profile.title.length >= 15) titleScore += 3
      else titleTips.push('Make your title more specific (e.g. "Senior React Developer" not "Developer")')
      if (profile.title.length >= 25) titleScore += 2
    } else {
      titleTips.push('Add a professional title — it\'s the first thing clients see')
    }
    sections.push({
      name: 'Professional Title',
      score: titleScore,
      maxScore: 10,
      status: titleScore >= 8 ? 'excellent' : titleScore >= 5 ? 'good' : titleScore > 0 ? 'needs_work' : 'missing',
      tips: titleTips,
    })

    // 3. Bio (15 pts)
    let bioScore = 0
    const bioTips: string[] = []
    if (profile.bio) {
      bioScore += 5
      if (profile.bio.length >= 100) bioScore += 3
      else bioTips.push('Expand your bio to at least 100 characters')
      if (profile.bio.length >= 200) bioScore += 3
      if (profile.bio.length >= 300) bioScore += 2
      else bioTips.push('Aim for 300+ characters — mention specialties, achievements, and what makes you unique')
      if (/\d+/.test(profile.bio)) bioScore += 2
      else bioTips.push('Add numbers to your bio (e.g. "5+ years experience", "50+ projects completed")')
    } else {
      bioTips.push('Write a compelling bio — this is your elevator pitch to every client')
    }
    sections.push({
      name: 'Bio / About',
      score: bioScore,
      maxScore: 15,
      status: bioScore >= 12 ? 'excellent' : bioScore >= 7 ? 'good' : bioScore > 0 ? 'needs_work' : 'missing',
      tips: bioTips,
    })

    // 4. Skills (15 pts)
    let skillsScore = 0
    const skillsTips: string[] = []
    const userSkills = profile.skills || []
    if (userSkills.length > 0) {
      skillsScore += 5
      if (userSkills.length >= 3) skillsScore += 3
      if (userSkills.length >= 5) skillsScore += 3
      else skillsTips.push('Add at least 5 skills to appear in more searches')
      if (userSkills.length >= 8) skillsScore += 2
      if (userSkills.length >= 10) skillsScore += 2
      else skillsTips.push('Top earners list 8-12 skills')
    } else {
      skillsTips.push('Add your skills — this is how clients find you')
    }
    sections.push({
      name: 'Skills',
      score: skillsScore,
      maxScore: 15,
      status: skillsScore >= 12 ? 'excellent' : skillsScore >= 7 ? 'good' : skillsScore > 0 ? 'needs_work' : 'missing',
      tips: skillsTips,
    })

    // 5. Rate (10 pts)
    let rateScore = 0
    const rateTips: string[] = []
    if (profile.hourly_rate && profile.hourly_rate > 0) {
      rateScore += 7
      // Check if competitive
      const topRates = (topFreelancers || []).map((f: any) => f.hourly_rate).filter(Boolean)
      const avgTopRate = topRates.length > 0 ? topRates.reduce((a: number, b: number) => a + b, 0) / topRates.length : 0
      if (avgTopRate > 0 && profile.hourly_rate >= avgTopRate * 0.5) rateScore += 3
      else rateTips.push(`Top freelancers charge ~KES ${Math.round(avgTopRate).toLocaleString()}/hr on average`)
    } else {
      rateTips.push('Set your hourly rate so clients can filter by budget')
    }
    sections.push({
      name: 'Hourly Rate',
      score: rateScore,
      maxScore: 10,
      status: rateScore >= 8 ? 'excellent' : rateScore >= 5 ? 'good' : rateScore > 0 ? 'needs_work' : 'missing',
      tips: rateTips,
    })

    // 6. Portfolio (15 pts)
    let portfolioScore = 0
    const portfolioTips: string[] = []
    const pCount = portfolioCount || 0
    if (pCount > 0) {
      portfolioScore += 5
      if (pCount >= 2) portfolioScore += 3
      if (pCount >= 4) portfolioScore += 3
      else portfolioTips.push('Add at least 4 portfolio items to showcase your range')
      if (pCount >= 6) portfolioScore += 4
    } else {
      portfolioTips.push('Add portfolio items — freelancers with portfolios earn 3x more')
    }
    sections.push({
      name: 'Portfolio',
      score: portfolioScore,
      maxScore: 15,
      status: portfolioScore >= 12 ? 'excellent' : portfolioScore >= 7 ? 'good' : portfolioScore > 0 ? 'needs_work' : 'missing',
      tips: portfolioTips,
    })

    // 7. Education & Certs (10 pts)
    let eduScore = 0
    const eduTips: string[] = []
    const edu = profile.education || []
    const certs = profile.certifications || []
    if (edu.length > 0) eduScore += 4
    else eduTips.push('Add your education background')
    if (certs.length > 0) eduScore += 4
    else eduTips.push('Add certifications — they boost credibility')
    if (edu.length > 0 && certs.length > 0) eduScore += 2
    sections.push({
      name: 'Education & Certifications',
      score: eduScore,
      maxScore: 10,
      status: eduScore >= 8 ? 'excellent' : eduScore >= 4 ? 'good' : eduScore > 0 ? 'needs_work' : 'missing',
      tips: eduTips,
    })

    // 8. Verification & Experience (10 pts)
    let verifyScore = 0
    const verifyTips: string[] = []
    if (profile.verification_status === 'ID-Verified' || profile.is_verified) verifyScore += 5
    else verifyTips.push('Verify your identity — verified freelancers get 4x more job offers')
    if (profile.years_experience && profile.years_experience > 0) verifyScore += 3
    else verifyTips.push('Add your years of experience')
    if (profile.availability) verifyScore += 2
    else verifyTips.push('Set your availability status so clients know when you can start')
    sections.push({
      name: 'Verification & Experience',
      score: verifyScore,
      maxScore: 10,
      status: verifyScore >= 8 ? 'excellent' : verifyScore >= 5 ? 'good' : verifyScore > 0 ? 'needs_work' : 'missing',
      tips: verifyTips,
    })

    const overallScore = sections.reduce((sum, s) => sum + s.score, 0)

    // --- Generate AI suggestions ---

    // Suggested title
    const roleHint = userSkills.length > 0 ? userSkills.slice(0, 3).join(', ') : 'Professional'
    const expLabel = (profile.years_experience || 0) > 5 ? 'Senior' : (profile.years_experience || 0) > 2 ? 'Experienced' : ''
    const suggestedTitle = profile.title && profile.title.length > 20
      ? profile.title
      : `${expLabel} ${roleHint} Specialist`.trim()

    // Suggested bio
    const bioSkills = userSkills.slice(0, 5).join(', ')
    const yearsText = profile.years_experience ? `${profile.years_experience}+ years` : 'several years'
    const jobsText = profile.jobs_completed ? `${profile.jobs_completed} projects completed` : ''
    const suggestedBio = `Results-driven professional with ${yearsText} of experience specializing in ${bioSkills || 'my field'}. ${jobsText ? `With ${jobsText} on HustleKE, I` : 'I'} bring a proven track record of delivering high-quality work on time and within budget. I focus on clear communication, attention to detail, and exceeding client expectations. Whether you need ${userSkills[0] || 'expert help'} or ${userSkills[1] || 'creative solutions'}, I am committed to bringing your vision to life with professional expertise.`

    // Suggested skills from market demand
    const demandMap: Record<string, number> = {}
    ;(openJobs || []).forEach((j: any) => {
      ;(j.skills_required || []).forEach((s: string) => {
        const sl = s.toLowerCase()
        demandMap[sl] = (demandMap[sl] || 0) + 1
      })
    })
    const userSkillsLower = userSkills.map((s: string) => s.toLowerCase())
    const suggestedSkills = Object.entries(demandMap)
      .filter(([skill]) => !userSkillsLower.includes(skill))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill]) => skill.charAt(0).toUpperCase() + skill.slice(1))

    // Top earner comparison
    const tops = topFreelancers || []
    const avgTopSkills = tops.length > 0 ? Math.round(tops.reduce((s: number, f: any) => s + (f.skills?.length || 0), 0) / tops.length) : 0
    const avgTopBio = tops.length > 0 ? Math.round(tops.reduce((s: number, f: any) => s + (f.bio?.length || 0), 0) / tops.length) : 0
    const avgTopRate = tops.length > 0 ? Math.round(tops.filter((f: any) => f.hourly_rate).reduce((s: number, f: any) => s + f.hourly_rate, 0) / tops.filter((f: any) => f.hourly_rate).length) : 0
    const avgTopExp = tops.length > 0 ? Math.round(tops.filter((f: any) => f.years_experience).reduce((s: number, f: any) => s + f.years_experience, 0) / Math.max(1, tops.filter((f: any) => f.years_experience).length)) : 0
    const topHavePhotos = tops.length > 0 ? Math.round(tops.filter((f: any) => f.avatar_url).length / tops.length * 100) : 0

    const topEarnerComparison: ProfileAnalysis['topEarnerComparison'] = [
      { metric: 'Skills Listed', yours: `${userSkills.length}`, topEarners: `${avgTopSkills}`, gap: userSkills.length >= avgTopSkills ? 'ahead' : userSkills.length >= avgTopSkills * 0.7 ? 'on_track' : 'behind' },
      { metric: 'Bio Length', yours: `${profile.bio?.length || 0} chars`, topEarners: `${avgTopBio} chars`, gap: (profile.bio?.length || 0) >= avgTopBio ? 'ahead' : (profile.bio?.length || 0) >= avgTopBio * 0.5 ? 'on_track' : 'behind' },
      { metric: 'Hourly Rate', yours: profile.hourly_rate ? `KES ${profile.hourly_rate.toLocaleString()}` : 'Not set', topEarners: `KES ${avgTopRate.toLocaleString()}`, gap: (profile.hourly_rate || 0) >= avgTopRate ? 'ahead' : (profile.hourly_rate || 0) >= avgTopRate * 0.5 ? 'on_track' : 'behind' },
      { metric: 'Experience', yours: profile.years_experience ? `${profile.years_experience} yrs` : 'Not set', topEarners: `${avgTopExp} yrs`, gap: (profile.years_experience || 0) >= avgTopExp ? 'ahead' : (profile.years_experience || 0) >= avgTopExp * 0.5 ? 'on_track' : 'behind' },
      { metric: 'Profile Photo', yours: profile.avatar_url ? 'Yes' : 'No', topEarners: `${topHavePhotos}% have one`, gap: profile.avatar_url ? 'ahead' : 'behind' },
    ]

    // Action plan — top 5 things to fix
    const allTips = sections.flatMap(s => s.tips.map(tip => ({ tip, sectionScore: s.score / s.maxScore })))
    allTips.sort((a, b) => a.sectionScore - b.sectionScore) // lowest-scoring sections first
    const actionPlan = allTips.slice(0, 5).map(t => t.tip)

    return jsonResponse({
      overallScore,
      maxScore: 100,
      sections,
      suggestedBio,
      suggestedTitle,
      suggestedSkills,
      topEarnerComparison,
      actionPlan,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[AI Profile Optimizer] Error:', error)
    return errorResponse('Failed to analyze profile', 500)
  }
}
