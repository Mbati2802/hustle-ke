import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// Skill database by category
const SKILL_DATABASE: Record<string, string[]> = {
  'Web Development': ['React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Python', 'Django', 'PHP', 'Laravel', 'WordPress', 'Vue.js', 'Angular', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API', 'AWS', 'Docker'],
  'Mobile Apps': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Firebase', 'Expo', 'Mobile UI/UX', 'App Store Optimization'],
  'Design & Creative': ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'UI/UX Design', 'Logo Design', 'Brand Identity', 'Wireframing', 'Prototyping', 'Graphic Design', 'Web Design'],
  'Writing & Content': ['SEO Writing', 'Blog Writing', 'Copywriting', 'Content Strategy', 'Technical Writing', 'Proofreading', 'Research', 'Swahili Translation', 'Creative Writing', 'Social Media Content'],
  'Marketing': ['Digital Marketing', 'Social Media Marketing', 'SEO', 'Google Ads', 'Facebook Ads', 'Email Marketing', 'Content Marketing', 'Analytics', 'Brand Strategy', 'TikTok Marketing'],
  'Data Entry': ['Microsoft Excel', 'Google Sheets', 'Data Entry', 'Data Analysis', 'Web Scraping', 'Database Management', 'Typing', 'Data Cleaning', 'PDF Conversion', 'CRM Management'],
  'Accounting & Finance': ['QuickBooks', 'Xero', 'Bookkeeping', 'Tax Preparation', 'KRA Compliance', 'Financial Analysis', 'Payroll', 'Invoicing', 'Auditing', 'Financial Reporting'],
  'Video & Animation': ['Video Editing', 'Adobe Premiere', 'After Effects', 'Motion Graphics', 'Animation', 'YouTube Production', 'Color Grading', 'Sound Design', 'Scriptwriting', 'DaVinci Resolve'],
  'Virtual Assistant': ['Administrative Support', 'Email Management', 'Calendar Management', 'Customer Service', 'Research', 'Data Entry', 'Social Media Management', 'Travel Planning', 'Scheduling', 'Document Preparation'],
}

// Category detection patterns
const CATEGORY_PATTERNS: Record<string, RegExp[]> = {
  'Web Development': [/website/i, /web\s*app/i, /landing\s*page/i, /dashboard/i, /api/i, /backend/i, /frontend/i, /next\.?js/i, /react/i, /node/i, /portal/i, /e-?commerce/i, /online\s*store/i, /wordpress/i],
  'Mobile Apps': [/mobile\s*app/i, /android/i, /ios\s*app/i, /flutter/i, /react\s*native/i, /phone\s*app/i],
  'Design & Creative': [/design/i, /ui\/?ux/i, /logo/i, /brand/i, /figma/i, /graphic/i, /mockup/i, /wireframe/i, /creative/i],
  'Writing & Content': [/writ/i, /article/i, /blog/i, /content/i, /copy/i, /script/i, /edit/i, /proofread/i],
  'Marketing': [/marketing/i, /social\s*media/i, /seo/i, /campaign/i, /ads/i, /advertis/i, /promotion/i],
  'Data Entry': [/data\s*entry/i, /excel/i, /spreadsheet/i, /typing/i, /scraping/i, /transcri/i],
  'Accounting & Finance': [/account/i, /bookkeep/i, /tax/i, /financ/i, /payroll/i, /invoic/i, /audit/i, /kra/i],
  'Video & Animation': [/video/i, /animation/i, /motion\s*graphic/i, /editing/i, /youtube/i, /premiere/i],
  'Virtual Assistant': [/virtual\s*assist/i, /admin/i, /email\s*manage/i, /scheduling/i, /customer\s*service/i],
}

function detectCategory(text: string): string {
  const scores: Record<string, number> = {}
  for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    scores[cat] = patterns.filter(p => p.test(text)).length
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
  return sorted[0][1] > 0 ? sorted[0][0] : 'Web Development'
}

function detectSkills(text: string, category: string): string[] {
  const allSkills = Object.values(SKILL_DATABASE).flat()
  const detected = allSkills.filter(skill => {
    const pattern = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return pattern.test(text)
  })

  // Add category default skills if few detected
  const categorySkills = SKILL_DATABASE[category] || []
  if (detected.length < 3) {
    const topCategorySkills = categorySkills.slice(0, 4)
    topCategorySkills.forEach(s => {
      if (!detected.includes(s)) detected.push(s)
    })
  }

  return Array.from(new Set(detected)).slice(0, 8)
}

function extractTimeline(text: string): { estimate: string; days: number } {
  if (/urgent|asap|immediately|today|rush/i.test(text)) return { estimate: '1-3 days', days: 3 }
  if (/few\s*days|this\s*week|quick/i.test(text)) return { estimate: '3-5 days', days: 5 }
  if (/one\s*week|1\s*week|next\s*week/i.test(text)) return { estimate: '5-7 days', days: 7 }
  if (/two\s*weeks|2\s*weeks|couple\s*weeks/i.test(text)) return { estimate: '10-14 days', days: 14 }
  if (/one\s*month|1\s*month|a\s*month/i.test(text)) return { estimate: '3-4 weeks', days: 28 }
  if (/few\s*months|2-3\s*months/i.test(text)) return { estimate: '2-3 months', days: 75 }

  // Estimate from complexity
  const wordCount = text.trim().split(/\s+/).length
  if (wordCount < 30) return { estimate: '1-2 weeks', days: 10 }
  if (wordCount < 80) return { estimate: '2-3 weeks', days: 18 }
  return { estimate: '3-4 weeks', days: 25 }
}

// POST /api/ai-client-brief — Generate structured job posting from plain description
export async function POST(req: NextRequest) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  try {
    const body = await req.json()
    const { description = '', preferred_category = '' } = body

    if (!description || description.trim().length < 15) {
      return errorResponse('Please describe your project in at least 15 characters', 400)
    }

    const text = description.trim()

    // --- Detect category ---
    const category = preferred_category || detectCategory(text)

    // --- Detect skills ---
    const suggestedSkills = detectSkills(text, category)

    // --- Extract timeline ---
    const timeline = extractTimeline(text)

    // --- Fetch market data for budget estimation ---
    const { data: similarJobs } = await supabase
      .from('jobs')
      .select('title, budget_min, budget_max, skills_required, status, proposals_count, created_at')
      .overlaps('skills_required', suggestedSkills.slice(0, 3))
      .order('created_at', { ascending: false })
      .limit(100)

    const completedJobs = (similarJobs || []).filter((j: any) => j.budget_max > 0 || j.budget_min > 0)
    const budgets = completedJobs
      .map((j: any) => j.budget_max || j.budget_min || 0)
      .filter((b: number) => b > 0)
      .sort((a: number, b: number) => a - b)

    let budgetLow = 5000
    let budgetHigh = 30000
    let budgetMedian = 15000

    if (budgets.length > 3) {
      budgetLow = budgets[Math.floor(budgets.length * 0.25)]
      budgetMedian = budgets[Math.floor(budgets.length * 0.5)]
      budgetHigh = budgets[Math.floor(budgets.length * 0.75)]
    }

    // Adjust for complexity
    const wordCount = text.split(/\s+/).length
    const complexityMultiplier = wordCount > 100 ? 1.3 : wordCount > 50 ? 1.1 : 1.0
    budgetLow = Math.round(budgetLow * complexityMultiplier)
    budgetMedian = Math.round(budgetMedian * complexityMultiplier)
    budgetHigh = Math.round(budgetHigh * complexityMultiplier)

    // --- Generate structured title ---
    const sentences = text.split(/[.!?\n]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 5)
    const firstSentence = sentences[0] || text.slice(0, 80)

    // Extract core action/need
    let generatedTitle = ''
    const titlePatterns = [
      /(?:need|want|looking for|require|hire)\s+(?:a\s+|an\s+)?(.{10,60}?)(?:\.|,|$| to | for | who)/i,
      /(?:build|create|develop|design|write|make)\s+(?:a\s+|an\s+|my\s+)?(.{8,60}?)(?:\.|,|$| with| using| that)/i,
    ]
    for (const pattern of titlePatterns) {
      const match = text.match(pattern)
      if (match) {
        generatedTitle = match[1].trim()
        generatedTitle = generatedTitle.charAt(0).toUpperCase() + generatedTitle.slice(1)
        break
      }
    }
    if (!generatedTitle) {
      // Fallback: use category + first meaningful phrase
      const shortDesc = firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence
      generatedTitle = shortDesc.charAt(0).toUpperCase() + shortDesc.slice(1)
    }
    // Ensure title is not too long
    if (generatedTitle.length > 80) {
      generatedTitle = generatedTitle.slice(0, 77) + '...'
    }

    // --- Generate structured description ---
    const cleanedSentences = sentences.map((s: string) => {
      const cap = s.charAt(0).toUpperCase() + s.slice(1)
      return cap.endsWith('.') || cap.endsWith('!') || cap.endsWith('?') ? cap : cap + '.'
    })

    // Build the overview
    const overview = cleanedSentences.join(' ')

    // Generate deliverables based on category and text
    let deliverables: string[] = []
    const catKey = category.toLowerCase()
    if (catKey.includes('web') || /website|web\s*app|e-?commerce/i.test(text)) {
      deliverables = [
        'Fully responsive website/application compatible with all devices',
        'Clean, well-structured, and documented source code',
        'Cross-browser testing and quality assurance',
        'Deployment to hosting environment',
      ]
      if (/m-?pesa/i.test(text)) deliverables.push('M-Pesa payment integration')
      if (/admin/i.test(text) || /dashboard/i.test(text)) deliverables.push('Admin panel/dashboard')
      if (/seo/i.test(text)) deliverables.push('Basic SEO optimization')
    } else if (catKey.includes('mobile')) {
      deliverables = [
        'Fully functional mobile application',
        'UI following platform design guidelines',
        'App store submission-ready build',
        'Source code and documentation',
      ]
    } else if (catKey.includes('design')) {
      deliverables = [
        'Final design files in all required formats (PNG, SVG, PDF)',
        'Source/editable design files',
        'Multiple concept options for review',
        'Revision rounds as discussed',
      ]
      if (/logo/i.test(text)) deliverables.push('Logo variations (color, monochrome, icon)')
      if (/brand/i.test(text)) deliverables.push('Brand style guide')
    } else if (catKey.includes('writing')) {
      deliverables = [
        'Original, plagiarism-free content',
        'SEO-optimized writing with relevant keywords',
        'Properly formatted documents with headings',
        'Up to 2 rounds of revisions',
      ]
    } else if (catKey.includes('marketing')) {
      deliverables = [
        'Comprehensive marketing strategy document',
        'Campaign setup and creative assets',
        'Performance tracking and analytics',
        'Regular progress reports',
      ]
    } else {
      deliverables = [
        'All agreed-upon deliverables completed to specification',
        'Regular progress updates throughout the project',
        'Quality assurance and testing',
        'Final delivery with documentation',
      ]
    }

    // Build full structured description
    let structuredDescription = `📋 **Project Overview:**\n${overview}\n\n`
    structuredDescription += `📦 **Deliverables:**\n${deliverables.map(d => `• ${d}`).join('\n')}\n\n`

    // Requirements for freelancer
    const requirements = [
      `Proven experience in ${category}`,
      suggestedSkills.length > 0 ? `Proficiency in ${suggestedSkills.slice(0, 4).join(', ')}` : null,
      'Strong communication skills and responsiveness',
      'Portfolio or samples of similar previous work',
      'Ability to meet the estimated timeline',
    ].filter(Boolean) as string[]

    structuredDescription += `👤 **Ideal Freelancer:**\n${requirements.map(r => `• ${r}`).join('\n')}\n\n`
    structuredDescription += `⏱ **Estimated Timeline:** ${timeline.estimate}\n\n`
    structuredDescription += `📩 **To Apply:**\nPlease include your relevant portfolio, a brief approach to this project, and your estimated timeline in your proposal.`

    // --- Find similar successful projects ---
    const recentSimilar = (similarJobs || [])
      .filter((j: any) => j.title && (j.budget_min > 0 || j.budget_max > 0))
      .slice(0, 5)
      .map((j: any) => ({
        title: j.title,
        budget_range: `KES ${(j.budget_min || 0).toLocaleString()} - ${(j.budget_max || j.budget_min || 0).toLocaleString()}`,
        proposals: j.proposals_count || 0,
        skills: (j.skills_required || []).slice(0, 4),
      }))

    // --- Available freelancers estimate ---
    const { count: availableFreelancers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'Freelancer')
      .overlaps('skills', suggestedSkills.slice(0, 3))

    return jsonResponse({
      generated_title: generatedTitle,
      generated_description: structuredDescription,
      category,
      suggested_skills: suggestedSkills,
      budget_suggestion: {
        low: budgetLow,
        median: budgetMedian,
        high: budgetHigh,
        data_points: budgets.length,
        currency: 'KES',
      },
      timeline,
      deliverables,
      requirements,
      similar_projects: recentSimilar,
      available_freelancers: availableFreelancers || 0,
      tips: [
        'Be specific about your requirements — detailed briefs attract better proposals',
        'Include examples or references of what you like for design/creative projects',
        `Budget range KES ${budgetLow.toLocaleString()} - ${budgetHigh.toLocaleString()} is competitive for this type of project`,
        'Respond to proposals within 48 hours to attract top talent',
        'Use the escrow system to protect both parties',
      ],
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate brief', 500)
  }
}
