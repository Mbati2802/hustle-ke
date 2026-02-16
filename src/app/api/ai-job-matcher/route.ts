import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// GET /api/ai-job-matcher?skills=React,Node.js&experience=3&rate=2000
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const url = new URL(req.url)
  const userSkills = url.searchParams.get('skills')?.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) || []
  const experience = parseInt(url.searchParams.get('experience') || '0')
  const rate = parseInt(url.searchParams.get('rate') || '0')

  if (userSkills.length === 0) {
    return errorResponse('At least one skill is required', 400)
  }

  try {
    // Fetch open jobs
    const { data: jobs, error } = await supabase!
      .from('jobs')
      .select('id, title, description, skills_required, budget_min, budget_max, payment_type, location_preference, remote_allowed, created_at, views, status, client:profiles!client_id(id, full_name, avatar_url, verification_status, hustle_score)')
      .eq('status', 'Open')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Fetch demand/supply data for salary prediction
    const { data: freelancers } = await supabase!
      .from('profiles')
      .select('skills, hourly_rate')
      .eq('role', 'Freelancer')
      .not('skills', 'is', null)

    // Build skill supply map
    const skillSupply: Record<string, number> = {}
    const skillRates: Record<string, number[]> = {}
    ;(freelancers || []).forEach((f: any) => {
      ;(f.skills || []).forEach((s: string) => {
        const sl = s.toLowerCase()
        skillSupply[sl] = (skillSupply[sl] || 0) + 1
        if (f.hourly_rate) {
          if (!skillRates[sl]) skillRates[sl] = []
          skillRates[sl].push(f.hourly_rate)
        }
      })
    })

    // Score each job against user's skills
    const scoredJobs = (jobs || []).map((job: any) => {
      const jobSkills = (job.skills_required || []).map((s: string) => s.toLowerCase())
      if (jobSkills.length === 0) return null

      // Skill match
      const matchedSkills = userSkills.filter(us => jobSkills.some((js: string) => js === us || js.includes(us) || us.includes(js)))
      const skillMatchRatio = matchedSkills.length / jobSkills.length
      const userCoverageRatio = matchedSkills.length / userSkills.length

      if (matchedSkills.length === 0) return null

      // Scoring components
      let score = 0

      // Skill match (0-50 points)
      score += skillMatchRatio * 40
      score += userCoverageRatio * 10

      // Budget fit (0-15 points)
      const avgBudget = ((job.budget_min || 0) + (job.budget_max || 0)) / 2
      if (rate > 0 && avgBudget > 0) {
        const budgetFit = Math.min(avgBudget / (rate * 20), 1) // assume 20 hrs
        score += budgetFit * 15
      } else {
        score += 8 // neutral if no rate
      }

      // Competition (0-15 points) — fewer freelancers with these skills = better
      const avgSupply = jobSkills.reduce((sum: number, s: string) => sum + (skillSupply[s] || 0), 0) / jobSkills.length
      if (avgSupply < 5) score += 15
      else if (avgSupply < 15) score += 10
      else if (avgSupply < 30) score += 5
      else score += 2

      // Freshness (0-10 points)
      const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysOld < 1) score += 10
      else if (daysOld < 3) score += 8
      else if (daysOld < 7) score += 5
      else if (daysOld < 14) score += 2

      // Client quality (0-10 points)
      const client = job.client
      if (client?.verification_status === 'ID-Verified') score += 5
      if (client?.hustle_score > 70) score += 5
      else if (client?.hustle_score > 40) score += 3

      score = Math.min(100, Math.round(score))

      // Generate match reasons
      const reasons: string[] = []
      if (skillMatchRatio >= 1) reasons.push('You have all required skills')
      else if (skillMatchRatio >= 0.7) reasons.push(`You match ${matchedSkills.length}/${jobSkills.length} required skills`)
      else reasons.push(`${matchedSkills.length} of your skills match`)

      if (daysOld < 2) reasons.push('Posted recently — early applicants have an advantage')
      if (avgSupply < 10) reasons.push('Low competition — few freelancers have these skills')
      if (client?.verification_status === 'ID-Verified') reasons.push('Verified client')
      if (avgBudget > 30000) reasons.push('High-value project')

      // Missing skills
      const missingSkills = jobSkills.filter((js: string) => !matchedSkills.some(ms => js === ms || js.includes(ms) || ms.includes(js)))

      // Win probability
      let winProb = Math.min(95, Math.round(score * 0.8 + (experience > 3 ? 10 : experience * 3)))

      return {
        ...job,
        matchScore: score,
        matchedSkills: matchedSkills.map(s => job.skills_required.find((js: string) => js.toLowerCase() === s) || s),
        missingSkills: missingSkills.map((s: string) => job.skills_required.find((js: string) => js.toLowerCase() === s) || s),
        reasons,
        winProbability: winProb,
        competitionLevel: avgSupply < 5 ? 'low' : avgSupply < 15 ? 'medium' : avgSupply < 30 ? 'high' : 'saturated',
        daysOld: Math.round(daysOld),
      }
    }).filter(Boolean)

    // Sort by match score
    scoredJobs.sort((a: any, b: any) => b.matchScore - a.matchScore)

    // Salary insights for user's skills
    const salaryInsights = userSkills.map(skill => {
      const rates = skillRates[skill] || []
      const supply = skillSupply[skill] || 0
      return {
        skill,
        supply,
        avgRate: rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0,
        minRate: rates.length > 0 ? Math.min(...rates) : 0,
        maxRate: rates.length > 0 ? Math.max(...rates) : 0,
      }
    })

    return jsonResponse({
      matches: scoredJobs.slice(0, 20),
      totalMatches: scoredJobs.length,
      salaryInsights,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[AI Job Matcher] Error:', error)
    return errorResponse('Failed to generate job matches', 500)
  }
}
