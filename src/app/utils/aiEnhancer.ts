/**
 * AI Job Description Enhancer
 * Analyzes user input text and generates a professionally enhanced version
 * with proper structure, relevant details, and clear requirements.
 */

interface EnhanceOptions {
  title: string
  description: string
  category: string
  skills: string[]
}

// Keywords to detect project type / intent
const projectTypePatterns: Record<string, RegExp[]> = {
  website: [/website/i, /web\s*site/i, /web\s*app/i, /landing\s*page/i, /webpage/i, /web\s*page/i, /portal/i, /site/i],
  ecommerce: [/e-?commerce/i, /online\s*store/i, /shop/i, /shopping/i, /marketplace/i, /product\s*listing/i, /woocommerce/i, /shopify/i],
  mobileApp: [/mobile\s*app/i, /android/i, /ios\s*app/i, /react\s*native/i, /flutter/i, /phone\s*app/i, /application/i],
  logo: [/logo/i, /brand\s*identity/i, /branding/i, /brand\s*design/i],
  design: [/design/i, /ui\/?ux/i, /figma/i, /mockup/i, /wireframe/i, /prototype/i, /interface/i],
  writing: [/writ/i, /content/i, /article/i, /blog/i, /copy/i, /seo\s*content/i, /script/i],
  marketing: [/marketing/i, /social\s*media/i, /campaign/i, /ads/i, /advertis/i, /seo/i, /promotion/i, /tiktok/i, /instagram/i, /facebook/i],
  video: [/video/i, /animation/i, /motion\s*graphic/i, /editing/i, /youtube/i],
  dataEntry: [/data\s*entry/i, /excel/i, /spreadsheet/i, /typing/i, /records/i, /database/i, /transcri/i],
  accounting: [/account/i, /bookkeep/i, /tax/i, /financ/i, /payroll/i, /invoic/i, /audit/i],
  virtualAssistant: [/virtual\s*assist/i, /admin\s*support/i, /email\s*manage/i, /calendar/i, /scheduling/i],
  customerService: [/customer\s*s/i, /support/i, /help\s*desk/i, /chat\s*support/i, /call\s*center/i],
  sales: [/sales/i, /lead\s*gen/i, /cold\s*call/i, /business\s*develop/i, /prospect/i],
  music: [/music/i, /audio/i, /voice\s*over/i, /podcast/i, /sound/i, /jingle/i, /narrat/i],
}

// Detect what kind of project this is
function detectProjectTypes(text: string): string[] {
  const types: string[] = []
  for (const [type, patterns] of Object.entries(projectTypePatterns)) {
    if (patterns.some(p => p.test(text))) {
      types.push(type)
    }
  }
  return types
}

// Extract key features/requirements mentioned by user
function extractKeyDetails(text: string): {
  features: string[]
  technologies: string[]
  hasTimeline: boolean
  hasBudgetMention: boolean
  sentenceCount: number
  wordCount: number
} {
  const techPatterns = [
    /react/i, /next\.?js/i, /node\.?js/i, /python/i, /typescript/i, /javascript/i,
    /html/i, /css/i, /vue/i, /angular/i, /php/i, /laravel/i, /django/i,
    /wordpress/i, /shopify/i, /mongodb/i, /postgresql/i, /mysql/i, /firebase/i,
    /flutter/i, /swift/i, /kotlin/i, /react\s*native/i, /aws/i, /docker/i,
    /figma/i, /photoshop/i, /illustrator/i, /xd/i, /canva/i,
    /m-?pesa/i, /tailwind/i, /bootstrap/i, /graphql/i, /rest\s*api/i,
    /excel/i, /google\s*sheets/i, /quickbooks/i, /xero/i, /salesforce/i,
    /premiere/i, /after\s*effects/i, /blender/i, /davinci/i
  ]

  const technologies = techPatterns
    .filter(p => p.test(text))
    .map(p => {
      const match = text.match(p)
      return match ? match[0] : ''
    })
    .filter(Boolean)

  // Extract feature-like phrases
  const features: string[] = []
  const featurePatterns = [
    /(?:need|want|require|should\s+have|must\s+have|include|with)\s+(.{10,80}?)(?:\.|,|$)/gi,
    /(?:looking\s+for|seeking)\s+(.{10,80}?)(?:\.|,|$)/gi,
  ]
  for (const pattern of featurePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      features.push(match[1].trim())
    }
  }

  const hasTimeline = /week|month|day|deadline|urgent|asap|quickly|fast|rush/i.test(text)
  const hasBudgetMention = /budget|kes|ksh|cost|price|pay|rate|afford/i.test(text)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
  const words = text.trim().split(/\s+/)

  return { features, technologies, hasTimeline, hasBudgetMention, sentenceCount: sentences.length, wordCount: words.length }
}

// Clean and capitalize a sentence properly
function capitalizeSentence(s: string): string {
  const trimmed = s.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

// Generate scope/deliverables based on project type and category
function generateDeliverables(projectTypes: string[], category: string, originalText: string): string[] {
  const deliverables: string[] = []

  if (projectTypes.includes('website') || projectTypes.includes('ecommerce')) {
    deliverables.push(
      'Fully responsive website compatible with desktop, tablet, and mobile devices',
      'Clean, well-documented source code',
      'Cross-browser testing (Chrome, Firefox, Safari, Edge)',
    )
    if (projectTypes.includes('ecommerce')) {
      deliverables.push('Product catalog with search and filtering', 'Secure checkout and payment integration')
      if (/m-?pesa/i.test(originalText)) deliverables.push('M-Pesa payment gateway integration')
    }
    if (/seo/i.test(originalText)) deliverables.push('Basic SEO optimization and meta tags')
    if (/admin/i.test(originalText)) deliverables.push('Admin dashboard for content management')
  }

  if (projectTypes.includes('mobileApp')) {
    deliverables.push(
      'Fully functional mobile application',
      'Intuitive UI following platform design guidelines',
      'App store submission-ready build',
    )
    if (/android/i.test(originalText) && /ios/i.test(originalText)) {
      deliverables.push('Both Android and iOS versions')
    }
    if (/push/i.test(originalText) || /notif/i.test(originalText)) {
      deliverables.push('Push notification system')
    }
    if (/m-?pesa/i.test(originalText)) deliverables.push('M-Pesa payment integration')
  }

  if (projectTypes.includes('logo') || projectTypes.includes('design')) {
    deliverables.push('High-resolution final design files (PNG, SVG, PDF)')
    if (projectTypes.includes('logo')) {
      deliverables.push(
        'Multiple logo concepts for review (minimum 3 initial concepts)',
        'Logo variations (full color, monochrome, icon-only)',
        'Brand style guide with color codes and typography',
      )
    } else {
      deliverables.push(
        'Complete UI/UX design with all screens and states',
        'Interactive prototype for user testing',
        'Design system with reusable components',
      )
    }
  }

  if (projectTypes.includes('writing')) {
    deliverables.push(
      'Original, plagiarism-free content',
      'SEO-optimized text with relevant keywords',
      'Up to 2 rounds of revisions included',
    )
    if (/blog/i.test(originalText)) deliverables.push('Well-structured blog posts with headings and meta descriptions')
    if (/article/i.test(originalText)) deliverables.push('Research-backed articles with proper citations')
  }

  if (projectTypes.includes('marketing')) {
    deliverables.push('Comprehensive marketing strategy document')
    if (/social\s*media/i.test(originalText)) deliverables.push('Social media content calendar and post templates')
    if (/ads|advertis/i.test(originalText)) deliverables.push('Ad creative assets and campaign setup')
    if (/seo/i.test(originalText)) deliverables.push('SEO audit report with actionable recommendations')
    deliverables.push('Performance metrics and analytics reporting')
  }

  if (projectTypes.includes('video')) {
    deliverables.push(
      'Final edited video in requested format and resolution',
      'Color correction and basic audio mixing',
      'Up to 2 revision rounds',
    )
    if (/youtube/i.test(originalText)) deliverables.push('YouTube-optimized format with custom thumbnail')
  }

  if (projectTypes.includes('dataEntry')) {
    deliverables.push(
      'Accurately entered data with 99%+ accuracy rate',
      'Organized and formatted spreadsheet/database',
      'Data validation and quality assurance report',
    )
  }

  if (projectTypes.includes('accounting')) {
    deliverables.push(
      'Accurate financial records and reports',
      'Organized bookkeeping entries',
    )
    if (/tax/i.test(originalText)) deliverables.push('Tax-compliant filing documentation')
    if (/kra/i.test(originalText)) deliverables.push('KRA-compliant returns and reports')
  }

  // Fallback if nothing matched
  if (deliverables.length === 0) {
    switch (category) {
      case 'Web Development':
        deliverables.push('Complete, tested, and deployed solution', 'Clean, documented source code', 'Post-launch support period')
        break
      case 'Mobile Apps':
        deliverables.push('Functional app build', 'Source code and documentation', 'Testing on major devices')
        break
      case 'Design & Creative':
        deliverables.push('Final design files in all required formats', 'Source/editable files', 'Revision rounds as discussed')
        break
      case 'Writing & Content':
        deliverables.push('Original written content', 'Properly formatted documents', 'Revisions as agreed')
        break
      default:
        deliverables.push('All agreed-upon deliverables completed to specification', 'Progress updates throughout the project', 'Final delivery with documentation')
    }
  }

  return deliverables.slice(0, 6) // Cap at 6
}

// Generate ideal candidate requirements
function generateRequirements(projectTypes: string[], category: string, details: ReturnType<typeof extractKeyDetails>): string[] {
  const reqs: string[] = []

  if (details.technologies.length > 0) {
    reqs.push(`Proficiency in ${details.technologies.slice(0, 4).join(', ')}`)
  }

  // Category-based requirements
  switch (category) {
    case 'Web Development':
      reqs.push('Demonstrated experience with similar web projects')
      if (!details.technologies.length) reqs.push('Strong front-end and/or back-end development skills')
      reqs.push('Understanding of responsive design and web performance best practices')
      break
    case 'Mobile Apps':
      reqs.push('Published apps on App Store or Google Play')
      reqs.push('Experience with mobile UI/UX best practices')
      break
    case 'Design & Creative':
      reqs.push('Strong portfolio showcasing relevant design work')
      reqs.push('Expertise in modern design tools and visual communication')
      break
    case 'Writing & Content':
      reqs.push('Excellent command of English (and Swahili if specified)')
      reqs.push('Strong research and writing portfolio')
      break
    case 'Marketing':
      reqs.push('Proven track record of successful marketing campaigns')
      reqs.push('Data-driven approach with analytics experience')
      break
    case 'Data Entry':
      reqs.push('High typing speed with exceptional accuracy')
      reqs.push('Proficiency in spreadsheet tools (Excel/Google Sheets)')
      break
    case 'Accounting & Finance':
      reqs.push('Relevant accounting qualifications (CPA or equivalent)')
      reqs.push('Experience with Kenyan tax regulations and KRA compliance')
      break
    default:
      reqs.push('Relevant experience in the field')
      reqs.push('Strong communication skills')
  }

  reqs.push('Ability to meet deadlines and communicate progress regularly')
  reqs.push('Portfolio or samples of previous similar work')

  return Array.from(new Set(reqs)).slice(0, 5)
}

/**
 * Main enhancement function.
 * Reads the user's raw description, analyzes it, and produces a
 * well-structured, professionally worded job description.
 */
export function enhanceJobDescription({ title, description, category, skills }: EnhanceOptions): string {
  if (!description || description.trim().length < 10) return description

  const originalText = `${title} ${description}`
  const projectTypes = detectProjectTypes(originalText)
  const details = extractKeyDetails(originalText)

  // --- Build the enhanced description ---

  // 1. Overview — rewrite the user's core description
  const cleanedSentences = description
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5)
    .map(s => capitalizeSentence(s))

  // Ensure first sentence is strong
  let overview = ''
  if (cleanedSentences.length > 0) {
    // Keep the user's sentences but clean them up
    overview = cleanedSentences.map(s => {
      // Make sure each sentence ends with a period
      return s.endsWith('.') || s.endsWith('!') || s.endsWith('?') ? s : s + '.'
    }).join(' ')
  }

  // 2. Project scope / deliverables
  const deliverables = generateDeliverables(projectTypes, category, originalText)

  // 3. Requirements
  const requirements = generateRequirements(projectTypes, category, details)

  // 4. Build final enhanced text
  let enhanced = ''

  // Overview section
  enhanced += '📋 Project Overview:\n'
  enhanced += overview + '\n'

  // Scope & Deliverables
  if (deliverables.length > 0) {
    enhanced += '\n📦 Scope & Deliverables:\n'
    deliverables.forEach(d => {
      enhanced += `• ${d}\n`
    })
  }

  // Ideal Candidate
  if (requirements.length > 0) {
    enhanced += '\n👤 Ideal Candidate:\n'
    requirements.forEach(r => {
      enhanced += `• ${r}\n`
    })
  }

  // Skills mention
  if (skills.length > 0) {
    enhanced += '\n🛠 Required Skills: ' + skills.join(', ') + '\n'
  }

  // Application note
  enhanced += '\n📩 To Apply:\nPlease include your relevant portfolio, a brief approach to this project, and your estimated timeline in your proposal.'

  return enhanced.trim()
}

/**
 * Generate a smart title based on description and category.
 */
export function generateJobTitle(description: string, category: string): string {
  if (!description || description.trim().length < 10) return ''

  const text = description.toLowerCase()
  const projectTypes = detectProjectTypes(text)

  // Try to build a specific title based on detected types
  if (projectTypes.includes('ecommerce')) {
    if (/shopify/i.test(text)) return 'Shopify E-commerce Store Development'
    if (/wordpress|woocommerce/i.test(text)) return 'WordPress/WooCommerce Online Store Setup'
    return 'E-commerce Website Development with Payment Integration'
  }
  if (projectTypes.includes('mobileApp')) {
    if (/react\s*native/i.test(text)) return 'React Native Mobile App Developer Needed'
    if (/flutter/i.test(text)) return 'Flutter Mobile App Development'
    if (/android/i.test(text) && /ios/i.test(text)) return 'Cross-Platform Mobile App Development (iOS & Android)'
    if (/android/i.test(text)) return 'Android App Developer Needed'
    if (/ios/i.test(text)) return 'iOS App Developer Needed'
    if (/delivery/i.test(text)) return 'Delivery/Logistics Mobile App Development'
    return 'Mobile App Development Project'
  }
  if (projectTypes.includes('website')) {
    if (/restaurant/i.test(text)) return 'Professional Restaurant Website Development'
    if (/portfolio/i.test(text)) return 'Portfolio Website Design & Development'
    if (/corporate|company/i.test(text)) return 'Corporate Website Design & Development'
    if (/blog/i.test(text)) return 'Blog Website Design & Development'
    if (/landing/i.test(text)) return 'High-Converting Landing Page Design'
    return 'Professional Website Design & Development'
  }
  if (projectTypes.includes('logo')) {
    if (/rebrand/i.test(text) || /redesign/i.test(text)) return 'Logo Redesign & Brand Refresh'
    return 'Logo Design & Brand Identity Creation'
  }
  if (projectTypes.includes('design')) {
    if (/ui\/?ux/i.test(text)) return 'UI/UX Designer Needed for Digital Product'
    return 'Creative Design Project — Professional Designer Needed'
  }
  if (projectTypes.includes('marketing')) {
    if (/social\s*media/i.test(text)) return 'Social Media Marketing Manager Needed'
    if (/seo/i.test(text)) return 'SEO Specialist for Website Optimization'
    if (/facebook|instagram|tiktok/i.test(text)) return 'Social Media Ad Campaign Management'
    return 'Digital Marketing Specialist Needed'
  }
  if (projectTypes.includes('writing')) {
    if (/blog/i.test(text)) return 'Blog Content Writer Needed'
    if (/copy/i.test(text)) return 'Professional Copywriter for Marketing Content'
    if (/seo/i.test(text)) return 'SEO Content Writer Needed'
    if (/technical/i.test(text)) return 'Technical Writer for Documentation'
    return 'Professional Content Writer Needed'
  }
  if (projectTypes.includes('video')) {
    if (/youtube/i.test(text)) return 'YouTube Video Editor Needed'
    if (/animation/i.test(text)) return 'Motion Graphics / Animation Project'
    return 'Professional Video Editing Project'
  }
  if (projectTypes.includes('dataEntry')) {
    return 'Data Entry Specialist Needed'
  }
  if (projectTypes.includes('accounting')) {
    if (/tax/i.test(text)) return 'Tax Preparation & Filing Specialist'
    if (/bookkeep/i.test(text)) return 'Bookkeeping & Financial Record Management'
    return 'Accounting & Finance Professional Needed'
  }
  if (projectTypes.includes('virtualAssistant')) {
    return 'Virtual Assistant for Administrative Support'
  }
  if (projectTypes.includes('customerService')) {
    return 'Customer Service Representative Needed'
  }
  if (projectTypes.includes('sales')) {
    return 'Sales Professional / Lead Generation Specialist'
  }
  if (projectTypes.includes('music')) {
    if (/voice/i.test(text)) return 'Professional Voice Over Artist Needed'
    if (/podcast/i.test(text)) return 'Podcast Audio Editor Needed'
    return 'Music / Audio Production Specialist'
  }

  // Category-based fallback
  const categoryTitles: Record<string, string> = {
    'Web Development': 'Web Development Project — Experienced Developer Needed',
    'Mobile Apps': 'Mobile App Development — Skilled Developer Needed',
    'Design & Creative': 'Creative Design Project — Designer Needed',
    'Writing & Content': 'Content Writer Needed for Writing Project',
    'Marketing': 'Digital Marketing Specialist Needed',
    'Virtual Assistance': 'Virtual Assistant Needed',
    'Customer Service': 'Customer Service Representative Needed',
    'Data Entry': 'Data Entry Specialist Needed',
    'Accounting & Finance': 'Accounting / Finance Professional Needed',
    'Sales': 'Sales Professional Needed',
    'Video & Animation': 'Video/Animation Specialist Needed',
    'Music & Audio': 'Audio/Music Professional Needed',
  }

  return categoryTitles[category] || 'Professional Freelancer Needed for Project'
}
