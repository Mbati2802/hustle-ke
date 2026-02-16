import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

interface SystemAd {
  id: string
  title: string
  description: string
  cta_text: string
  cta_link: string
  target_audience: string
  ad_type: string
  icon: string
  color_scheme: string
  is_system_generated: boolean
  priority: number
}

// GET /api/internal-ads — Get smart internal ads (system-generated + admin overrides)
export async function GET(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const url = new URL(req.url)
  const audience = url.searchParams.get('audience') || 'all' // all, client, freelancer, guest
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '6'), 12)

  // 1. Fetch admin-created active ads
  const now = new Date().toISOString()
  const { data: adminAds } = await supabase!
    .from('internal_ads')
    .select('*')
    .eq('is_active', true)
    .eq('is_system_generated', false)
    .or(`target_audience.eq.all,target_audience.eq.${audience}`)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('priority', { ascending: false })
    .limit(limit)

  // 2. Generate system-intelligence ads from live platform data
  const systemAds = await generateSystemAds(supabase!, audience, limit)

  // 3. Merge: admin ads take priority, fill remaining slots with system ads
  const adminCount = adminAds?.length || 0
  const remainingSlots = Math.max(0, limit - adminCount)
  const shuffledSystem = shuffleArray(systemAds).slice(0, remainingSlots)

  const allAds = [...(adminAds || []), ...shuffledSystem]

  // Track impressions for admin ads
  if (adminAds && adminAds.length > 0) {
    const ids = adminAds.map((a: any) => a.id)
    // Fire and forget - don't block response
    Promise.resolve(supabase!.rpc('increment_ad_impressions', { ad_ids: ids })).catch(() => {})
  }

  return jsonResponse({ ads: allAds })
}

// System intelligence: scan platform data and generate contextual ads
async function generateSystemAds(supabase: any, audience: string, maxAds: number): Promise<SystemAd[]> {
  const ads: SystemAd[] = []

  try {
    // Parallel data fetches for speed
    const [
      jobsResult,
      talentResult,
      statsResult,
      recentCompletedResult,
    ] = await Promise.all([
      // Recent open jobs count + categories
      supabase
        .from('jobs')
        .select('id, title, skills_required, budget_max, created_at')
        .eq('status', 'Open')
        .order('created_at', { ascending: false })
        .limit(50),
      // Top freelancers
      supabase
        .from('profiles')
        .select('id, full_name, title, skills, hustle_score, avatar_url, verification_status')
        .eq('role', 'Freelancer')
        .order('hustle_score', { ascending: false })
        .limit(20),
      // Platform stats
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      // Recently completed jobs
      supabase
        .from('jobs')
        .select('id, title, budget_max')
        .eq('status', 'Completed')
        .order('updated_at', { ascending: false })
        .limit(20),
    ])

    const openJobs = jobsResult.data || []
    const topTalent = talentResult.data || []
    const totalUsers = statsResult.count || 0
    const completedJobs = recentCompletedResult.data || []

    // --- Generate contextual ads based on real data ---

    // AD: Hot jobs right now (for freelancers)
    if (openJobs.length > 0 && (audience === 'all' || audience === 'freelancer' || audience === 'guest')) {
      const hotSkills = getTopSkills(openJobs.map((j: any) => j.skills_required || []).flat())
      const topSkill = hotSkills[0]
      ads.push({
        id: `sys-hot-jobs-${Date.now()}`,
        title: `${openJobs.length} Jobs Open Now`,
        description: topSkill
          ? `${topSkill} is trending! ${openJobs.filter((j: any) => j.skills_required?.includes(topSkill)).length} jobs need ${topSkill} skills right now.`
          : `New opportunities are posted every day. Browse and apply before others do.`,
        cta_text: 'Browse Jobs',
        cta_link: topSkill ? `/jobs?skill=${encodeURIComponent(topSkill)}` : '/jobs',
        target_audience: 'freelancer',
        ad_type: 'card',
        icon: 'Briefcase',
        color_scheme: 'green',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Trending skill demand (for freelancers)
    if (openJobs.length > 5 && (audience === 'all' || audience === 'freelancer' || audience === 'guest')) {
      const allSkills = openJobs.map((j: any) => j.skills_required || []).flat()
      const hotSkills = getTopSkills(allSkills)
      if (hotSkills.length >= 2) {
        ads.push({
          id: `sys-trending-skills-${Date.now()}`,
          title: 'Skills in High Demand',
          description: `${hotSkills.slice(0, 3).join(', ')} are the most requested skills this week. Upskill now to land more jobs.`,
          cta_text: 'Update Your Skills',
          cta_link: '/dashboard/settings?tab=profile',
          target_audience: 'freelancer',
          ad_type: 'card',
          icon: 'TrendingUp',
          color_scheme: 'blue',
          is_system_generated: true,
          priority: 0,
        })
      }
    }

    // AD: High-paying jobs (for freelancers)
    const highPayJobs = openJobs.filter((j: any) => j.budget_max && j.budget_max >= 50000)
    if (highPayJobs.length > 0 && (audience === 'all' || audience === 'freelancer' || audience === 'guest')) {
      const topJob = highPayJobs[Math.floor(Math.random() * highPayJobs.length)]
      ads.push({
        id: `sys-high-pay-${Date.now()}`,
        title: `Jobs Paying KES ${(topJob.budget_max || 50000).toLocaleString()}+`,
        description: `${highPayJobs.length} premium job${highPayJobs.length > 1 ? 's' : ''} available right now. High-value clients are looking for quality talent.`,
        cta_text: 'View Premium Jobs',
        cta_link: '/jobs?sort=budget_high',
        target_audience: 'freelancer',
        ad_type: 'card',
        icon: 'DollarSign',
        color_scheme: 'amber',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Top talent available (for clients)
    if (topTalent.length > 0 && (audience === 'all' || audience === 'client' || audience === 'guest')) {
      const verified = topTalent.filter((t: any) => t.verification_status === 'ID-Verified')
      ads.push({
        id: `sys-top-talent-${Date.now()}`,
        title: `${verified.length > 0 ? verified.length : topTalent.length} Verified Freelancers Ready`,
        description: `Top-rated professionals with proven track records are available now. Post a job and get proposals within hours.`,
        cta_text: 'Post a Job',
        cta_link: '/post-job',
        target_audience: 'client',
        ad_type: 'card',
        icon: 'Users',
        color_scheme: 'purple',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Platform growth / social proof
    if (totalUsers > 0) {
      ads.push({
        id: `sys-social-proof-${Date.now()}`,
        title: `Join ${totalUsers.toLocaleString()}+ Members`,
        description: `HustleKE is growing fast. ${completedJobs.length > 0 ? `${completedJobs.length}+ jobs completed recently.` : 'New jobs are posted daily.'} Be part of Kenya's top freelance marketplace.`,
        cta_text: 'Get Started',
        cta_link: '/signup',
        target_audience: 'guest',
        ad_type: 'card',
        icon: 'Zap',
        color_scheme: 'green',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Escrow protection (for clients)
    if (audience === 'all' || audience === 'client' || audience === 'guest') {
      ads.push({
        id: `sys-escrow-safe-${Date.now()}`,
        title: 'Your Money is Protected',
        description: 'M-Pesa powered escrow keeps funds secure. Pay only when work is delivered and approved. Zero risk hiring.',
        cta_text: 'How It Works',
        cta_link: '/how-it-works/escrow',
        target_audience: 'client',
        ad_type: 'card',
        icon: 'Shield',
        color_scheme: 'blue',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: M-Pesa instant payout (for freelancers)
    if (audience === 'all' || audience === 'freelancer') {
      ads.push({
        id: `sys-mpesa-payout-${Date.now()}`,
        title: 'Get Paid via M-Pesa Instantly',
        description: 'No waiting days for bank transfers. Complete work, get approved, and money hits your M-Pesa in seconds.',
        cta_text: 'Start Earning',
        cta_link: '/jobs',
        target_audience: 'freelancer',
        ad_type: 'card',
        icon: 'Smartphone',
        color_scheme: 'green',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Pro plan upsell (for freelancers)
    if (audience === 'all' || audience === 'freelancer') {
      ads.push({
        id: `sys-pro-upsell-${Date.now()}`,
        title: 'Go Pro — Lower Fees, More Jobs',
        description: 'Pro members pay only 4% service fee (vs 6%), get 20 proposals/day, and appear first in client searches.',
        cta_text: 'Upgrade to Pro',
        cta_link: '/pricing',
        target_audience: 'freelancer',
        ad_type: 'card',
        icon: 'Crown',
        color_scheme: 'amber',
        is_system_generated: true,
        priority: 0,
      })
    }

    // AD: Success story / completed jobs metric (for all)
    if (completedJobs.length > 0) {
      const totalValue = completedJobs.reduce((s: number, j: any) => s + (j.budget_max || 0), 0)
      if (totalValue > 0) {
        ads.push({
          id: `sys-success-metric-${Date.now()}`,
          title: `KES ${(totalValue).toLocaleString()} Earned Recently`,
          description: `Freelancers on HustleKE are getting paid. ${completedJobs.length} jobs completed and paid out recently.`,
          cta_text: audience === 'client' ? 'Hire Now' : 'Find Work',
          cta_link: audience === 'client' ? '/post-job' : '/jobs',
          target_audience: 'all',
          ad_type: 'card',
          icon: 'TrendingUp',
          color_scheme: 'green',
          is_system_generated: true,
          priority: 0,
        })
      }
    }

    // AD: Specific popular talent category (for clients)
    if (topTalent.length > 0 && (audience === 'all' || audience === 'client' || audience === 'guest')) {
      const talentSkills = topTalent.map((t: any) => t.skills || []).flat()
      const topCategories = getTopSkills(talentSkills)
      if (topCategories.length > 0) {
        const cat = topCategories[Math.floor(Math.random() * Math.min(3, topCategories.length))]
        const count = talentSkills.filter((s: string) => s === cat).length
        ads.push({
          id: `sys-talent-cat-${Date.now()}`,
          title: `${count}+ ${cat} Experts Available`,
          description: `Need a ${cat} specialist? Browse verified freelancers with proven skills and start your project today.`,
          cta_text: `Find ${cat} Talent`,
          cta_link: `/talent?skill=${encodeURIComponent(cat)}`,
          target_audience: 'client',
          ad_type: 'card',
          icon: 'Search',
          color_scheme: 'purple',
          is_system_generated: true,
          priority: 0,
        })
      }
    }

  } catch (error) {
    console.error('[Internal Ads] System ad generation error:', error)
  }

  return ads
}

function getTopSkills(skills: string[]): string[] {
  const count: Record<string, number> = {}
  skills.forEach(s => { count[s] = (count[s] || 0) + 1 })
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
