/**
 * ProposalForge™ Engine — AI Proposal Writer
 * 
 * Analyzes job descriptions, client history, and freelancer profiles
 * to generate optimized, personalized proposal drafts.
 */

interface JobAnalysis {
  keyRequirements: string[]
  painPoints: string[]
  budgetSignals: { min: number; max: number; flexibility: string }
  tone: string
  urgency: string
  projectType: string
  estimatedComplexity: string
}

interface ClientAnalysis {
  hiringHistory: { totalJobs: number; avgBudget: number; preferredSkills: string[] }
  reviewPatterns: { avgRating: number; commonPraise: string[]; commonComplaints: string[] }
  responseRate: number
  prefersBriefProposals: boolean
}

interface FreelancerMatch {
  relevantSkills: string[]
  matchingExperience: string[]
  strengths: string[]
  hustleScore: number
  completionRate: number
  verifiedSkills: string[]
}

interface ProposalStrategy {
  recommendedBid: number
  bidRationale: string
  openingHook: string
  keyPoints: string[]
  closingQuestion: string
  estimatedDuration: number
  tone: string
}

// Skill extraction patterns
const SKILL_PATTERNS: Record<string, string[]> = {
  'web development': ['react', 'next.js', 'nextjs', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'node', 'express', 'django', 'flask', 'php', 'laravel', 'wordpress'],
  'mobile development': ['flutter', 'react native', 'swift', 'kotlin', 'android', 'ios', 'mobile app', 'dart'],
  'design': ['figma', 'photoshop', 'illustrator', 'ui/ux', 'ui design', 'ux design', 'graphic design', 'logo', 'branding', 'canva'],
  'data': ['python', 'data analysis', 'machine learning', 'sql', 'excel', 'power bi', 'tableau', 'pandas', 'numpy', 'data science'],
  'writing': ['copywriting', 'content writing', 'blog', 'seo', 'article', 'technical writing', 'creative writing', 'editing', 'proofreading'],
  'marketing': ['social media', 'digital marketing', 'seo', 'google ads', 'facebook ads', 'email marketing', 'content marketing', 'brand strategy'],
  'video': ['video editing', 'premiere', 'after effects', 'animation', 'motion graphics', 'youtube', 'tiktok'],
}

// Pain point detection patterns
const PAIN_POINT_PATTERNS = [
  { pattern: /urgent|asap|immediately|rush|deadline|tight timeline/i, painPoint: 'Time pressure — client needs fast delivery' },
  { pattern: /previous.*failed|didn't work|bad experience|looking for someone reliable/i, painPoint: 'Previous bad experience — needs reliability assurance' },
  { pattern: /budget.*limited|affordable|cost-effective|within budget/i, painPoint: 'Budget conscious — needs value demonstration' },
  { pattern: /complex|complicated|challenging|difficult/i, painPoint: 'Complex project — needs expertise proof' },
  { pattern: /ongoing|long.?term|regular|monthly|retainer/i, painPoint: 'Looking for long-term relationship' },
  { pattern: /scale|grow|expand|increase/i, painPoint: 'Growth-focused — wants scalable solutions' },
  { pattern: /fix|bug|broken|not working|issue|problem/i, painPoint: 'Has existing problems that need fixing' },
  { pattern: /redesign|revamp|modernize|update|refresh/i, painPoint: 'Wants to modernize existing work' },
]

// Tone detection
function detectTone(text: string): string {
  const lower = text.toLowerCase()
  if (/professional|corporate|enterprise|formal/i.test(lower)) return 'formal'
  if (/fun|creative|exciting|cool|awesome/i.test(lower)) return 'casual'
  if (/startup|innovative|disrupt|mvp/i.test(lower)) return 'startup'
  if (/serious|critical|important|essential/i.test(lower)) return 'serious'
  return 'professional'
}

// Urgency detection
function detectUrgency(text: string): string {
  const lower = text.toLowerCase()
  if (/urgent|asap|immediately|today|tomorrow|this week/i.test(lower)) return 'high'
  if (/soon|next week|within.*days|quick/i.test(lower)) return 'medium'
  return 'normal'
}

// Extract requirements from job description
function extractRequirements(description: string): string[] {
  const requirements: string[] = []
  const lines = description.split(/[.\n]/)
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue
    
    // Lines that look like requirements
    if (/must|should|need|require|looking for|experience with|proficient|knowledge of|ability to|skilled in/i.test(trimmed)) {
      requirements.push(trimmed.replace(/^[-•*]\s*/, '').trim())
    }
  }
  
  // Also extract from bullet points
  const bullets = description.match(/[-•*]\s*.+/g) || []
  for (const bullet of bullets) {
    const clean = bullet.replace(/^[-•*]\s*/, '').trim()
    if (clean.length > 10 && !requirements.includes(clean)) {
      requirements.push(clean)
    }
  }
  
  return requirements.slice(0, 8)
}

// Detect skills mentioned in text
function detectSkills(text: string): string[] {
  const lower = text.toLowerCase()
  const found: string[] = []
  
  for (const [category, skills] of Object.entries(SKILL_PATTERNS)) {
    for (const skill of skills) {
      if (lower.includes(skill) && !found.includes(skill)) {
        found.push(skill)
      }
    }
  }
  
  return found
}

/**
 * Analyze a job posting
 */
export function analyzeJob(job: {
  title: string
  description: string
  budget_min?: number
  budget_max?: number
  category?: string
  skills_required?: string[]
}): JobAnalysis {
  const fullText = `${job.title} ${job.description}`
  
  const painPoints = PAIN_POINT_PATTERNS
    .filter(p => p.pattern.test(fullText))
    .map(p => p.painPoint)
  
  const detectedSkills = detectSkills(fullText)
  const requirements = extractRequirements(job.description)
  
  // Budget analysis
  const budgetMin = job.budget_min || 0
  const budgetMax = job.budget_max || budgetMin * 1.5
  const flexibility = budgetMax > budgetMin * 1.3 ? 'flexible' : budgetMax === budgetMin ? 'fixed' : 'moderate'
  
  // Complexity estimation
  const wordCount = job.description.split(/\s+/).length
  const requirementCount = requirements.length
  const complexity = requirementCount > 5 || wordCount > 300 ? 'high' : requirementCount > 2 ? 'medium' : 'low'
  
  return {
    keyRequirements: requirements.length > 0 ? requirements : detectedSkills.map(s => `Proficiency in ${s}`),
    painPoints: painPoints.length > 0 ? painPoints : ['Standard project — focus on quality and reliability'],
    budgetSignals: { min: budgetMin, max: budgetMax, flexibility },
    tone: detectTone(fullText),
    urgency: detectUrgency(fullText),
    projectType: job.category || 'General',
    estimatedComplexity: complexity,
  }
}

/**
 * Analyze a client's hiring history
 */
export function analyzeClient(clientData: {
  jobs?: Array<{ budget_min?: number; budget_max?: number; status?: string; category?: string; skills_required?: string[] }>
  reviews?: Array<{ rating?: number; comment?: string }>
}): ClientAnalysis {
  const jobs = clientData.jobs || []
  const reviews = clientData.reviews || []
  
  const totalJobs = jobs.length
  const avgBudget = totalJobs > 0
    ? Math.round(jobs.reduce((sum, j) => sum + ((j.budget_min || 0) + (j.budget_max || j.budget_min || 0)) / 2, 0) / totalJobs)
    : 0
  
  // Extract preferred skills
  const skillCounts = new Map<string, number>()
  for (const job of jobs) {
    for (const skill of (job.skills_required || [])) {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1)
    }
  }
  const preferredSkills = Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill]) => skill)
  
  // Review analysis
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0
  
  const commonPraise: string[] = []
  const commonComplaints: string[] = []
  for (const review of reviews) {
    if (!review.comment) continue
    const lower = review.comment.toLowerCase()
    if (/great|excellent|amazing|professional|fast|quality|recommend/i.test(lower)) {
      if ((review.rating || 0) >= 4) commonPraise.push(review.comment.slice(0, 100))
    }
    if (/late|slow|poor|issue|problem|disappoint/i.test(lower)) {
      if ((review.rating || 0) <= 3) commonComplaints.push(review.comment.slice(0, 100))
    }
  }
  
  // Response rate estimation
  const completedJobs = jobs.filter(j => j.status === 'Completed').length
  const responseRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 50
  
  // Brief proposal preference (clients with many jobs tend to prefer shorter proposals)
  const prefersBriefProposals = totalJobs > 10
  
  return {
    hiringHistory: { totalJobs, avgBudget, preferredSkills },
    reviewPatterns: { avgRating, commonPraise: commonPraise.slice(0, 3), commonComplaints: commonComplaints.slice(0, 3) },
    responseRate,
    prefersBriefProposals,
  }
}

/**
 * Match freelancer strengths to job requirements
 */
export function matchFreelancer(
  profile: {
    skills?: string[]
    title?: string
    bio?: string
    hustle_score?: number
    jobs_completed?: number
    hourly_rate?: number
  },
  verifiedSkills: Array<{ skill_name: string; badge_level: string }>,
  jobAnalysis: JobAnalysis
): FreelancerMatch {
  const profileSkills = (profile.skills || []).map(s => s.toLowerCase())
  const jobSkills = jobAnalysis.keyRequirements.map(r => r.toLowerCase())
  
  // Find matching skills
  const relevantSkills = profileSkills.filter(skill =>
    jobSkills.some(req => req.includes(skill) || skill.includes(req.split(' ').pop() || ''))
  )
  
  // Matching experience from bio
  const matchingExperience: string[] = []
  if (profile.bio) {
    for (const req of jobAnalysis.keyRequirements) {
      const keywords = req.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      if (keywords.some(kw => profile.bio!.toLowerCase().includes(kw))) {
        matchingExperience.push(req)
      }
    }
  }
  
  // Strengths
  const strengths: string[] = []
  if ((profile.hustle_score || 0) >= 80) strengths.push('High Hustle Score — proven track record')
  if ((profile.jobs_completed || 0) >= 10) strengths.push(`${profile.jobs_completed} jobs completed on HustleKE`)
  if (verifiedSkills.length > 0) {
    const diamondSkills = verifiedSkills.filter(s => s.badge_level === 'diamond')
    const goldSkills = verifiedSkills.filter(s => s.badge_level === 'gold')
    if (diamondSkills.length > 0) strengths.push(`Diamond-verified in ${diamondSkills.map(s => s.skill_name).join(', ')}`)
    else if (goldSkills.length > 0) strengths.push(`Gold-verified in ${goldSkills.map(s => s.skill_name).join(', ')}`)
  }
  if (relevantSkills.length >= 3) strengths.push('Strong skill match for this project')
  
  return {
    relevantSkills,
    matchingExperience,
    strengths,
    hustleScore: profile.hustle_score || 0,
    completionRate: profile.jobs_completed ? Math.min(100, profile.jobs_completed * 10) : 0,
    verifiedSkills: verifiedSkills.map(s => `${s.skill_name} (${s.badge_level})`),
  }
}

/**
 * Generate proposal strategy
 */
export function generateStrategy(
  jobAnalysis: JobAnalysis,
  clientAnalysis: ClientAnalysis,
  freelancerMatch: FreelancerMatch
): ProposalStrategy {
  const { budgetSignals, urgency, painPoints } = jobAnalysis
  
  // Bid recommendation
  let recommendedBid: number
  let bidRationale: string
  
  if (clientAnalysis.hiringHistory.avgBudget > 0 && budgetSignals.min > 0) {
    // Use client's historical spending as a signal
    const clientAvg = clientAnalysis.hiringHistory.avgBudget
    const jobMid = (budgetSignals.min + budgetSignals.max) / 2
    recommendedBid = Math.round((clientAvg * 0.3 + jobMid * 0.7))
    bidRationale = `Based on the job budget range and client's typical spending (avg KES ${clientAvg.toLocaleString()})`
  } else if (budgetSignals.min > 0) {
    // Bid at 85% of max for competitive positioning
    recommendedBid = Math.round(budgetSignals.min + (budgetSignals.max - budgetSignals.min) * 0.65)
    bidRationale = 'Positioned competitively within the budget range'
  } else {
    recommendedBid = 0
    bidRationale = 'No budget specified — suggest a fair rate based on scope'
  }
  
  // Opening hook based on pain points
  let openingHook: string
  if (painPoints.some(p => p.includes('bad experience'))) {
    openingHook = `I noticed you're looking for someone reliable for this project. I understand the frustration of working with unreliable freelancers — let me show you why I'm different.`
  } else if (painPoints.some(p => p.includes('Time pressure'))) {
    openingHook = `I can see this is time-sensitive, and I want you to know I'm available to start immediately. Here's how I'd deliver this quickly without cutting corners.`
  } else if (painPoints.some(p => p.includes('Complex project'))) {
    openingHook = `This is exactly the kind of challenging project I thrive on. I've handled similar complexity before, and here's my approach.`
  } else if (painPoints.some(p => p.includes('Growth-focused'))) {
    openingHook = `I love working on growth projects. I don't just build — I build with scale in mind. Here's how I'd approach this.`
  } else {
    openingHook = `Your project caught my eye because it aligns perfectly with my expertise. Here's why I'm the right fit.`
  }
  
  // Key points
  const keyPoints: string[] = []
  if (freelancerMatch.relevantSkills.length > 0) {
    keyPoints.push(`I have hands-on experience with ${freelancerMatch.relevantSkills.slice(0, 3).join(', ')} — exactly what this project needs.`)
  }
  if (freelancerMatch.strengths.length > 0) {
    keyPoints.push(freelancerMatch.strengths[0])
  }
  if (freelancerMatch.verifiedSkills.length > 0) {
    keyPoints.push(`My skills are SkillDNA™ verified: ${freelancerMatch.verifiedSkills.slice(0, 2).join(', ')}`)
  }
  keyPoints.push('I follow a structured approach: understand requirements → plan → build → test → deliver.')
  
  // Closing question
  const closingQuestions = [
    'Would you be open to a quick chat to discuss the project scope in more detail?',
    'I have a few questions about the project that would help me give you an even more accurate timeline. Can we connect?',
    'What would success look like for you on this project? I want to make sure I exceed your expectations.',
    'Is there a specific deadline you\'re working towards? I want to plan my delivery accordingly.',
  ]
  const closingQuestion = closingQuestions[Math.floor(Math.random() * closingQuestions.length)]
  
  // Duration estimation
  const complexity = jobAnalysis.estimatedComplexity
  const estimatedDuration = complexity === 'high' ? 21 : complexity === 'medium' ? 10 : 5
  
  return {
    recommendedBid,
    bidRationale,
    openingHook,
    keyPoints,
    closingQuestion,
    estimatedDuration,
    tone: jobAnalysis.tone,
  }
}

/**
 * Generate the full proposal cover letter
 */
export function generateProposal(
  strategy: ProposalStrategy,
  freelancerName: string,
  jobTitle: string,
  clientPrefersBrief: boolean
): string {
  const parts: string[] = []
  
  // Opening
  parts.push(strategy.openingHook)
  parts.push('')
  
  // Key points
  if (clientPrefersBrief) {
    // Brief version for experienced clients
    parts.push('**Why me:**')
    for (const point of strategy.keyPoints.slice(0, 3)) {
      parts.push(`• ${point}`)
    }
  } else {
    // Detailed version
    parts.push('**What I bring to this project:**')
    parts.push('')
    for (const point of strategy.keyPoints) {
      parts.push(`• ${point}`)
    }
  }
  
  parts.push('')
  
  // Timeline
  if (strategy.estimatedDuration > 0) {
    parts.push(`**Estimated delivery:** ${strategy.estimatedDuration} days`)
    parts.push('')
  }
  
  // Closing
  parts.push(strategy.closingQuestion)
  parts.push('')
  parts.push(`Looking forward to working with you!`)
  parts.push(`— ${freelancerName}`)
  
  return parts.join('\n')
}
