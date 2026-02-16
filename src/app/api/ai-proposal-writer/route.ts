import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// POST /api/ai-proposal-writer — Generate AI proposal from job description
export async function POST(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  try {
    const body = await req.json()
    const {
      job_description = '',
      job_title = '',
      job_skills = [] as string[],
      job_budget_min = 0,
      job_budget_max = 0,
      job_id = '',
      freelancer_skills = [] as string[],
      freelancer_experience = 0,
      freelancer_rate = 0,
      freelancer_name = '',
      tone = 'professional',
    } = body

    if (!job_description || job_description.trim().length < 20) {
      return errorResponse('Job description must be at least 20 characters', 400)
    }

    // Fetch market data for bid suggestion
    const [jobsRes, freelancersRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('budget_min, budget_max, skills_required, status')
        .eq('status', 'Open')
        .limit(200),
      supabase
        .from('profiles')
        .select('hourly_rate, skills, total_earned, jobs_completed')
        .eq('role', 'Freelancer')
        .limit(200),
    ])

    const jobs = jobsRes.data || []
    const freelancers = freelancersRes.data || []

    // --- Skill matching analysis ---
    const jobSkillsLower = (job_skills as string[]).map((s: string) => s.toLowerCase())
    const freelancerSkillsLower = (freelancer_skills as string[]).map((s: string) => s.toLowerCase())

    const matchedSkills = freelancerSkillsLower.filter((s: string) => jobSkillsLower.includes(s))
    const missingSkills = jobSkillsLower.filter((s: string) => !freelancerSkillsLower.includes(s))
    const bonusSkills = freelancerSkillsLower.filter((s: string) => !jobSkillsLower.includes(s))

    const skillMatchPct = jobSkillsLower.length > 0
      ? Math.round((matchedSkills.length / jobSkillsLower.length) * 100)
      : 50

    // --- Bid suggestion based on market data ---
    const similarJobs = jobs.filter((j: any) => {
      if (!j.skills_required) return false
      const jSkills = (j.skills_required as string[]).map((s: string) => s.toLowerCase())
      return jobSkillsLower.some((s: string) => jSkills.includes(s))
    })

    let suggestedBidLow = job_budget_min || 5000
    let suggestedBidHigh = job_budget_max || 50000

    if (similarJobs.length > 3) {
      const budgets = similarJobs
        .map((j: any) => j.budget_max || j.budget_min || 0)
        .filter((b: number) => b > 0)
        .sort((a: number, b: number) => a - b)

      if (budgets.length > 0) {
        const p25 = budgets[Math.floor(budgets.length * 0.25)]
        const p75 = budgets[Math.floor(budgets.length * 0.75)]
        const median = budgets[Math.floor(budgets.length * 0.5)]

        suggestedBidLow = Math.round(p25 * 0.9)
        suggestedBidHigh = Math.round(p75 * 1.1)

        // Adjust based on experience
        if (freelancer_experience > 5) {
          suggestedBidLow = Math.round(median)
          suggestedBidHigh = Math.round(p75 * 1.2)
        } else if (freelancer_experience > 2) {
          suggestedBidLow = Math.round(p25)
          suggestedBidHigh = Math.round(p75)
        }
      }
    }

    // Clamp to job budget range if available
    if (job_budget_min && suggestedBidLow < job_budget_min * 0.8) {
      suggestedBidLow = Math.round(job_budget_min * 0.85)
    }
    if (job_budget_max && suggestedBidHigh > job_budget_max * 1.3) {
      suggestedBidHigh = Math.round(job_budget_max * 1.15)
    }

    const suggestedBid = Math.round((suggestedBidLow + suggestedBidHigh) / 2)

    // --- Win probability ---
    let winScore = 40 // base

    // Skill match factor (0–25)
    winScore += Math.round(skillMatchPct * 0.25)

    // Experience factor (0–15)
    winScore += Math.min(15, freelancer_experience * 2)

    // Bid competitiveness (0–10)
    if (job_budget_max > 0) {
      const bidRatio = suggestedBid / job_budget_max
      if (bidRatio <= 1.0) winScore += 10
      else if (bidRatio <= 1.15) winScore += 5
    } else {
      winScore += 5
    }

    // Competition factor (0–10)
    const competingFreelancers = freelancers.filter((f: any) => {
      if (!f.skills) return false
      const fSkills = (f.skills as string[]).map((s: string) => s.toLowerCase())
      return jobSkillsLower.some((s: string) => fSkills.includes(s))
    }).length
    if (competingFreelancers < 10) winScore += 10
    else if (competingFreelancers < 30) winScore += 5

    winScore = Math.min(95, Math.max(15, winScore))

    // --- Detect project type for context ---
    const combinedText = `${job_title} ${job_description}`.toLowerCase()
    const isWebProject = /website|web\s*app|landing\s*page|next\.?js|react|frontend|backend|api|dashboard/i.test(combinedText)
    const isMobileProject = /mobile|android|ios|flutter|react native|app/i.test(combinedText)
    const isDesignProject = /design|ui\/?ux|figma|logo|brand|graphic/i.test(combinedText)
    const isWritingProject = /writ|content|article|blog|copy|seo content/i.test(combinedText)
    const isMarketingProject = /marketing|social media|campaign|ads|seo/i.test(combinedText)
    const isDataProject = /data|excel|spreadsheet|scraping|analysis/i.test(combinedText)

    // --- Generate proposal text ---
    const toneStyles: Record<string, { greeting: string; closing: string; style: string }> = {
      professional: {
        greeting: 'Dear Hiring Manager,',
        closing: 'I look forward to the opportunity to discuss this project further and demonstrate how I can deliver outstanding results for your team.',
        style: 'formal',
      },
      casual: {
        greeting: `Hi there! 👋`,
        closing: `I'd love to chat more about this and get started. Let me know if you have any questions!`,
        style: 'friendly',
      },
      technical: {
        greeting: 'Hello,',
        closing: 'I am available to discuss the technical architecture and implementation approach at your convenience. Looking forward to collaborating on this project.',
        style: 'detailed',
      },
    }

    const toneConfig = toneStyles[tone] || toneStyles.professional

    // Extract key requirements from description
    const sentences = job_description.split(/[.!?\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 10)
    const keyRequirements = sentences.slice(0, 3).map((s: string) => {
      const cleaned = s.charAt(0).toUpperCase() + s.slice(1)
      return cleaned.endsWith('.') ? cleaned : cleaned + '.'
    })

    // Build approach section based on project type
    let approachPoints: string[] = []
    if (isWebProject) {
      approachPoints = [
        'Analyze your requirements and create a detailed technical specification',
        'Set up the development environment with modern tools and best practices',
        'Build the solution iteratively with regular progress updates and demos',
        'Conduct thorough testing across browsers and devices before delivery',
        'Provide clean, documented code with deployment support',
      ]
    } else if (isMobileProject) {
      approachPoints = [
        'Review your app requirements and create wireframes for key screens',
        'Develop the app following platform-specific design guidelines',
        'Implement features incrementally with regular build previews',
        'Test on multiple devices and screen sizes',
        'Prepare store-ready builds with deployment documentation',
      ]
    } else if (isDesignProject) {
      approachPoints = [
        'Research your brand, audience, and competitors for design context',
        'Create initial mood boards and concept directions for your review',
        'Develop refined designs based on your feedback',
        'Deliver final files in all required formats (PNG, SVG, PDF, source files)',
        'Include a brief style guide for consistent brand application',
      ]
    } else if (isWritingProject) {
      approachPoints = [
        'Research the topic thoroughly to ensure accuracy and depth',
        'Create an outline for your approval before writing',
        'Write engaging, SEO-optimized content tailored to your audience',
        'Include proper formatting, headings, and meta descriptions',
        'Deliver plagiarism-free content with up to 2 revision rounds',
      ]
    } else if (isMarketingProject) {
      approachPoints = [
        'Audit your current presence and analyze your target market',
        'Develop a data-driven strategy aligned with your goals',
        'Create compelling content and campaign assets',
        'Implement campaigns with tracking and analytics setup',
        'Provide detailed performance reports with optimization recommendations',
      ]
    } else if (isDataProject) {
      approachPoints = [
        'Understand your data requirements and expected output format',
        'Set up efficient workflows for accuracy and speed',
        'Process data with quality checks at each stage',
        'Deliver organized, validated results in your preferred format',
        'Include a summary report of work completed and any findings',
      ]
    } else {
      approachPoints = [
        'Thoroughly review your requirements to ensure full understanding',
        'Create a detailed plan with milestones and deliverables',
        'Execute the work with regular progress updates',
        'Deliver high-quality results with revision rounds as needed',
        'Provide documentation and post-delivery support',
      ]
    }

    // Build the proposal
    let proposal = `${toneConfig.greeting}\n\n`

    // Opening paragraph — show understanding
    if (tone === 'casual') {
      proposal += `I came across your project "${job_title}" and I'm really excited about it! `
      proposal += `I have ${freelancer_experience > 0 ? `${freelancer_experience}+ years of` : 'solid'} experience `
      proposal += `in ${matchedSkills.length > 0 ? matchedSkills.slice(0, 3).join(', ') : 'this field'} and I'm confident I can deliver exactly what you need.\n\n`
    } else if (tone === 'technical') {
      proposal += `I am writing to express my interest in the "${job_title}" project. `
      proposal += `Having reviewed your requirements in detail, I believe my ${freelancer_experience > 0 ? `${freelancer_experience}+ years of` : ''} technical expertise `
      proposal += `in ${matchedSkills.length > 0 ? matchedSkills.slice(0, 4).join(', ') : 'relevant technologies'} makes me well-suited for this engagement.\n\n`
    } else {
      proposal += `I am writing to express my strong interest in the "${job_title}" project. `
      proposal += `With ${freelancer_experience > 0 ? `${freelancer_experience}+ years of` : 'extensive'} experience `
      proposal += `in ${matchedSkills.length > 0 ? matchedSkills.slice(0, 3).join(', ') : 'this domain'}, I am confident in my ability to deliver exceptional results.\n\n`
    }

    // Understanding section
    proposal += `**Understanding Your Requirements:**\n`
    keyRequirements.forEach((req: string) => {
      proposal += `• ${req}\n`
    })
    proposal += `\n`

    // Approach
    proposal += `**My Approach:**\n`
    approachPoints.forEach((point: string) => {
      proposal += `${tone === 'casual' ? '✅' : '•'} ${point}\n`
    })
    proposal += `\n`

    // Skills highlight
    if (matchedSkills.length > 0) {
      proposal += `**Relevant Skills:**\n`
      proposal += matchedSkills.map((s: string) => `• ${s.charAt(0).toUpperCase() + s.slice(1)}`).join('\n')
      if (bonusSkills.length > 0) {
        proposal += `\n• Plus: ${bonusSkills.slice(0, 3).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}`
      }
      proposal += `\n\n`
    }

    // Timeline & availability
    proposal += `**Timeline & Availability:**\n`
    proposal += `I am available to start immediately and can dedicate focused time to ensure timely delivery. `
    proposal += `I will provide regular progress updates and am responsive to feedback throughout the project.\n\n`

    // Closing
    proposal += toneConfig.closing

    if (freelancer_name) {
      proposal += `\n\nBest regards,\n${freelancer_name}`
    }

    // --- Generate improvement suggestions ---
    const suggestions: string[] = []
    if (matchedSkills.length < jobSkillsLower.length) {
      suggestions.push(`Mention specific experience with ${missingSkills.slice(0, 2).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' and ')} to address all required skills`)
    }
    suggestions.push('Add a specific example or case study from a similar past project')
    suggestions.push('Include a concrete timeline with milestones (e.g., "Week 1: Design, Week 2: Development")')
    if (freelancer_experience > 3) {
      suggestions.push('Mention your years of experience and a quantifiable achievement')
    }
    suggestions.push('Reference something specific from the job description to show you read it carefully')
    if (tone !== 'casual') {
      suggestions.push('Consider adding a portfolio link or relevant work sample')
    }

    return jsonResponse({
      proposal,
      bid_suggestion: {
        low: suggestedBidLow,
        high: suggestedBidHigh,
        recommended: suggestedBid,
        market_data_points: similarJobs.length,
        currency: 'KES',
      },
      win_probability: winScore,
      skill_analysis: {
        matched: matchedSkills.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
        missing: missingSkills.map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
        bonus: bonusSkills.slice(0, 5).map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)),
        match_percentage: skillMatchPct,
      },
      suggestions,
      tone_used: tone,
      word_count: proposal.split(/\s+/).length,
      competing_freelancers: competingFreelancers,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate proposal', 500)
  }
}
