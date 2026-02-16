import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

interface SkillIntel {
  skill: string
  demand: number        // open jobs requiring this skill
  supply: number        // freelancers with this skill
  demandSupplyRatio: number  // >1 = more demand than supply (opportunity)
  avgBudget: number     // average budget for jobs with this skill
  maxBudget: number     // highest budget seen
  completedJobs: number // how many jobs with this skill were completed
  totalEarnings: number // sum of budgets from completed jobs
  trend: 'hot' | 'rising' | 'stable' | 'cooling'
  competitionLevel: 'low' | 'medium' | 'high' | 'saturated'
  opportunityScore: number // 0-100, higher = better opportunity
}

interface MarketPulse {
  totalOpenJobs: number
  totalFreelancers: number
  totalCompletedJobs: number
  avgJobBudget: number
  topPayingSkill: string
  topPayingAmount: number
  biggestGapSkill: string
  biggestGapRatio: number
  platformGrowthRate: number // new members this month vs last
}

// GET /api/career-intelligence — AI-driven market analysis
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const url = new URL(req.url)
  const userSkills = url.searchParams.get('skills')?.split(',').map(s => s.trim()).filter(Boolean) || []

  try {
    // Parallel data fetches
    const [
      openJobsRes,
      freelancersRes,
      completedJobsRes,
      recentJobsRes,
      olderJobsRes,
      recentMembersRes,
      olderMembersRes,
    ] = await Promise.all([
      // All open jobs with skills
      supabase!
        .from('jobs')
        .select('id, skills_required, budget_min, budget_max, created_at')
        .eq('status', 'Open'),
      // All freelancers with skills
      supabase!
        .from('profiles')
        .select('id, skills, hourly_rate')
        .eq('role', 'Freelancer')
        .not('skills', 'is', null),
      // Completed jobs
      supabase!
        .from('jobs')
        .select('id, skills_required, budget_max, updated_at')
        .eq('status', 'Completed'),
      // Jobs from last 30 days (for trend: recent)
      supabase!
        .from('jobs')
        .select('id, skills_required, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // Jobs from 30-60 days ago (for trend: comparison)
      supabase!
        .from('jobs')
        .select('id, skills_required, created_at')
        .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // New members this month
      supabase!
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // Members from last month
      supabase!
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const openJobs = openJobsRes.data || []
    const freelancers = freelancersRes.data || []
    const completedJobs = completedJobsRes.data || []
    const recentJobs = recentJobsRes.data || []
    const olderJobs = olderJobsRes.data || []
    const recentMembersCount = recentMembersRes.count || 0
    const olderMembersCount = olderMembersRes.count || 0

    // --- Build skill-level intelligence ---
    const skillDemand: Record<string, number> = {}
    const skillBudgets: Record<string, number[]> = {}
    const skillSupply: Record<string, number> = {}
    const skillCompleted: Record<string, number> = {}
    const skillEarnings: Record<string, number> = {}
    const skillRecentDemand: Record<string, number> = {}
    const skillOlderDemand: Record<string, number> = {}

    // Count demand from open jobs
    openJobs.forEach((j: any) => {
      (j.skills_required || []).forEach((s: string) => {
        skillDemand[s] = (skillDemand[s] || 0) + 1
        if (!skillBudgets[s]) skillBudgets[s] = []
        if (j.budget_max) skillBudgets[s].push(j.budget_max)
      })
    })

    // Count supply from freelancers
    freelancers.forEach((f: any) => {
      (f.skills || []).forEach((s: string) => {
        skillSupply[s] = (skillSupply[s] || 0) + 1
      })
    })

    // Count completed jobs + earnings
    completedJobs.forEach((j: any) => {
      (j.skills_required || []).forEach((s: string) => {
        skillCompleted[s] = (skillCompleted[s] || 0) + 1
        skillEarnings[s] = (skillEarnings[s] || 0) + (j.budget_max || 0)
      })
    })

    // Trend: compare recent vs older demand
    recentJobs.forEach((j: any) => {
      (j.skills_required || []).forEach((s: string) => {
        skillRecentDemand[s] = (skillRecentDemand[s] || 0) + 1
      })
    })
    olderJobs.forEach((j: any) => {
      (j.skills_required || []).forEach((s: string) => {
        skillOlderDemand[s] = (skillOlderDemand[s] || 0) + 1
      })
    })

    // Combine all skills
    const allSkills = new Set([...Object.keys(skillDemand), ...Object.keys(skillSupply)])

    const skillIntel: SkillIntel[] = Array.from(allSkills).map(skill => {
      const demand = skillDemand[skill] || 0
      const supply = skillSupply[skill] || 0
      const budgets = skillBudgets[skill] || []
      const avgBudget = budgets.length > 0 ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : 0
      const maxBudget = budgets.length > 0 ? Math.max(...budgets) : 0
      const completed = skillCompleted[skill] || 0
      const earnings = skillEarnings[skill] || 0
      const recent = skillRecentDemand[skill] || 0
      const older = skillOlderDemand[skill] || 0

      // Demand/supply ratio
      const ratio = supply > 0 ? demand / supply : demand > 0 ? demand * 2 : 0

      // Trend analysis
      let trend: 'hot' | 'rising' | 'stable' | 'cooling' = 'stable'
      if (older > 0) {
        const growth = (recent - older) / older
        if (growth > 0.5) trend = 'hot'
        else if (growth > 0.1) trend = 'rising'
        else if (growth < -0.2) trend = 'cooling'
      } else if (recent > 2) {
        trend = 'hot'
      } else if (recent > 0) {
        trend = 'rising'
      }

      // Competition level
      let competitionLevel: 'low' | 'medium' | 'high' | 'saturated' = 'medium'
      if (supply === 0) competitionLevel = 'low'
      else if (ratio > 1.5) competitionLevel = 'low'
      else if (ratio > 0.8) competitionLevel = 'medium'
      else if (ratio > 0.3) competitionLevel = 'high'
      else competitionLevel = 'saturated'

      // Opportunity score (0-100)
      let score = 50
      score += Math.min(20, demand * 4)          // demand boost
      score += ratio > 1 ? Math.min(15, ratio * 5) : -10  // supply gap boost/penalty
      score += trend === 'hot' ? 15 : trend === 'rising' ? 8 : trend === 'cooling' ? -10 : 0
      score += avgBudget > 50000 ? 10 : avgBudget > 20000 ? 5 : 0
      score = Math.max(0, Math.min(100, Math.round(score)))

      return {
        skill,
        demand,
        supply,
        demandSupplyRatio: Math.round(ratio * 100) / 100,
        avgBudget,
        maxBudget,
        completedJobs: completed,
        totalEarnings: earnings,
        trend,
        competitionLevel,
        opportunityScore: score,
      }
    })

    // Sort by opportunity score
    skillIntel.sort((a, b) => b.opportunityScore - a.opportunityScore)

    // --- Market Pulse ---
    const allBudgets = openJobs.map((j: any) => j.budget_max).filter(Boolean)
    const avgJobBudget = allBudgets.length > 0 ? Math.round(allBudgets.reduce((a: number, b: number) => a + b, 0) / allBudgets.length) : 0
    const topPaying = skillIntel.reduce((best, s) => s.avgBudget > best.avgBudget ? s : best, skillIntel[0] || { skill: '', avgBudget: 0 })
    const biggestGap = skillIntel.reduce((best, s) => s.demandSupplyRatio > best.demandSupplyRatio ? s : best, skillIntel[0] || { skill: '', demandSupplyRatio: 0 })
    const growthRate = olderMembersCount > 0 ? Math.round(((recentMembersCount - olderMembersCount) / olderMembersCount) * 100) : recentMembersCount > 0 ? 100 : 0

    const marketPulse: MarketPulse = {
      totalOpenJobs: openJobs.length,
      totalFreelancers: freelancers.length,
      totalCompletedJobs: completedJobs.length,
      avgJobBudget,
      topPayingSkill: topPaying?.skill || '',
      topPayingAmount: topPaying?.avgBudget || 0,
      biggestGapSkill: biggestGap?.skill || '',
      biggestGapRatio: biggestGap?.demandSupplyRatio || 0,
      platformGrowthRate: growthRate,
    }

    // --- Earnings Projections (if user provided skills) ---
    let earningsProjection = null
    if (userSkills.length > 0) {
      const matchedSkills = skillIntel.filter(s => userSkills.some(us => us.toLowerCase() === s.skill.toLowerCase()))
      const unmatchedDemand = skillIntel
        .filter(s => !userSkills.some(us => us.toLowerCase() === s.skill.toLowerCase()))
        .filter(s => s.demand > 0 && s.opportunityScore > 60)
        .slice(0, 5)

      const avgRate = matchedSkills.length > 0
        ? Math.round(matchedSkills.reduce((s, sk) => s + sk.avgBudget, 0) / matchedSkills.length)
        : avgJobBudget

      // Estimate monthly earnings based on 2-3 jobs/month at average budget
      const monthlyLow = Math.round(avgRate * 1.5)
      const monthlyHigh = Math.round(avgRate * 3)

      earningsProjection = {
        matchedSkills: matchedSkills.map(s => s.skill),
        avgJobValue: avgRate,
        estimatedMonthlyLow: monthlyLow,
        estimatedMonthlyHigh: monthlyHigh,
        recommendedSkills: unmatchedDemand.map(s => ({
          skill: s.skill,
          reason: s.trend === 'hot' ? 'Trending — high demand right now'
            : s.competitionLevel === 'low' ? 'Low competition — easy to win jobs'
            : s.avgBudget > 30000 ? `High paying — avg KES ${s.avgBudget.toLocaleString()}/job`
            : `${s.demand} open jobs need this skill`,
          potentialEarningsBoost: Math.round(s.avgBudget * 0.3),
          opportunityScore: s.opportunityScore,
        })),
        competitiveEdge: matchedSkills.filter(s => s.competitionLevel === 'low' || s.competitionLevel === 'medium').map(s => s.skill),
        saturatedSkills: matchedSkills.filter(s => s.competitionLevel === 'saturated' || s.competitionLevel === 'high').map(s => s.skill),
      }
    }

    return jsonResponse({
      marketPulse,
      skills: skillIntel.slice(0, 30), // top 30 skills
      earningsProjection,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Career Intelligence] Error:', error)
    return errorResponse('Failed to generate career intelligence', 500)
  }
}
