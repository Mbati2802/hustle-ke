/**
 * SkillDNA™ Engine — AI Skill Verification System
 * 
 * Evaluates user responses to skill challenges using pattern matching,
 * keyword analysis, and structured rubric scoring.
 */

interface EvaluationCriterion {
  criterion: string
  weight: number
  description: string
}

interface EvaluationResult {
  score: number                    // 0-100
  badgeLevel: 'bronze' | 'silver' | 'gold' | 'diamond'
  criteriaScores: Array<{
    criterion: string
    score: number
    maxScore: number
    feedback: string
  }>
  overallFeedback: string
  strengths: string[]
  improvements: string[]
}

// Badge thresholds
function getBadgeLevel(score: number): 'bronze' | 'silver' | 'gold' | 'diamond' {
  if (score >= 90) return 'diamond'
  if (score >= 75) return 'gold'
  if (score >= 55) return 'silver'
  return 'bronze'
}

// Code quality indicators
const CODE_QUALITY_PATTERNS = {
  errorHandling: /try\s*{|catch\s*[({]|\.catch\(|if\s*\(!|throw\s+new|Error\(|except|raise\s/i,
  comments: /\/\/|\/\*|\*\/|#\s|"""|'''|--/,
  cleanNaming: /[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*|[a-z]+_[a-z]+/,
  modernSyntax: /const\s|let\s|=>\s*\{|async\s|await\s|\.map\(|\.filter\(|\.reduce\(|spread|\.\.\.|optional chaining/i,
  typeAnnotations: /:\s*(string|number|boolean|int|float|str|list|dict|Array|Record|Promise|void|any)/i,
  functionDeclaration: /function\s+\w+|def\s+\w+|const\s+\w+\s*=\s*(\(|async)|fn\s+\w+/,
}

// Writing quality indicators
const WRITING_QUALITY = {
  persuasiveWords: ['discover', 'transform', 'unlock', 'exclusive', 'proven', 'guaranteed', 'powerful', 'essential', 'revolutionary', 'seamless', 'effortless', 'premium', 'trusted', 'reliable', 'innovative'],
  ctaPhrases: ['get yours', 'order now', 'try today', 'start now', 'join', 'sign up', 'grab yours', 'don\'t miss', 'limited', 'shop now', 'buy now', 'learn more', 'get started'],
  structureMarkers: ['because', 'therefore', 'however', 'moreover', 'specifically', 'for example', 'in addition', 'as a result', 'firstly', 'secondly', 'finally'],
  brandToneWords: {
    modern: ['sleek', 'cutting-edge', 'innovative', 'smart', 'next-gen', 'digital', 'tech', 'modern'],
    practical: ['reliable', 'durable', 'built for', 'designed for', 'everyday', 'practical', 'useful', 'efficient'],
    kenyan: ['kenya', 'kenyan', 'nairobi', 'safari', 'local', 'african', 'east african', 'proudly'],
  },
}

// Analysis quality indicators
const ANALYSIS_QUALITY = {
  dataReferences: /\d+%|\d+,\d+|\bKES\b|\brevenue\b|\borders\b|\breturn rate\b|\bavg\b|\baverage\b/i,
  causalLanguage: /because|caused by|due to|result of|led to|driven by|correlation|as.*increased|when.*grew/i,
  recommendations: /recommend|suggest|should|could|improve|implement|consider|strategy|action|step/i,
  specificity: /specific|exactly|precisely|\d+\s*(percent|%|days|weeks|months)/i,
}

function evaluateCodeChallenge(
  response: string,
  criteria: EvaluationCriterion[],
  challengeTitle: string
): EvaluationResult {
  const lower = response.toLowerCase()
  const criteriaScores: EvaluationResult['criteriaScores'] = []
  const strengths: string[] = []
  const improvements: string[] = []

  for (const c of criteria) {
    let score = 0
    let feedback = ''

    switch (c.criterion.toLowerCase()) {
      case 'bug identification': {
        const identifiesIssue = /stale|closure|state|batch|previous|old value|not.*updat|functional.*updat|prev/i.test(response)
        const mentionsSetState = /setState|set_?count|set_?state|updater|callback|prev\s*=>/i.test(response)
        score = (identifiesIssue ? 60 : 15) + (mentionsSetState ? 40 : 10)
        feedback = identifiesIssue
          ? 'Correctly identified the core issue'
          : 'Bug identification could be more precise'
        if (identifiesIssue) strengths.push('Strong debugging instinct — identified the root cause')
        else improvements.push('Practice identifying state management bugs in React')
        break
      }

      case 'correct fix': {
        const hasFunctionalUpdate = /prev\s*=>|prevCount|prevState|prev\s*\+\s*1|c\s*=>\s*c\s*\+/i.test(response)
        const hasCodeBlock = /```|setCount\(|setState\(/i.test(response)
        score = (hasFunctionalUpdate ? 70 : 10) + (hasCodeBlock ? 30 : 5)
        feedback = hasFunctionalUpdate
          ? 'Correct fix using functional updater pattern'
          : 'Fix should use the functional updater pattern (prev => prev + 1)'
        if (hasFunctionalUpdate) strengths.push('Knows the correct React pattern for batched updates')
        else improvements.push('Learn about React\'s functional state updater pattern')
        break
      }

      case 'explanation quality': {
        const wordCount = response.split(/\s+/).length
        const hasExplanation = wordCount > 20
        const mentionsBatching = /batch|queue|async|render cycle|closure|stale/i.test(response)
        const isClear = wordCount > 30 && wordCount < 500
        score = (hasExplanation ? 30 : 5) + (mentionsBatching ? 40 : 10) + (isClear ? 30 : 10)
        feedback = hasExplanation && mentionsBatching
          ? 'Clear, thorough explanation'
          : 'Explanation could be more detailed about why the bug occurs'
        break
      }

      case 'correct batching': {
        const hasBatchLogic = /batch|chunk|slice|splice|Promise\.all|concurrent|parallel/i.test(response)
        const hasLoop = /for\s*\(|while\s*\(|\.forEach|for\s+.*\s+of|for\s+.*\s+in/i.test(response)
        score = (hasBatchLogic ? 50 : 10) + (hasLoop ? 50 : 10)
        feedback = hasBatchLogic ? 'Correct batching approach' : 'Batching logic needs work'
        if (hasBatchLogic) strengths.push('Understands concurrent processing patterns')
        break
      }

      case 'order preservation': {
        const preservesOrder = /order|index|position|map\(|result\[|results\[|push/i.test(response)
        score = preservesOrder ? 100 : 30
        feedback = preservesOrder ? 'Results maintain original order' : 'Consider how to preserve result order'
        break
      }

      case 'error handling': {
        const hasErrorHandling = CODE_QUALITY_PATTERNS.errorHandling.test(response)
        score = hasErrorHandling ? 100 : 20
        feedback = hasErrorHandling ? 'Good error handling included' : 'Add try/catch or error handling'
        if (!hasErrorHandling) improvements.push('Always include error handling in async code')
        break
      }

      case 'code quality': {
        let qualityScore = 0
        if (CODE_QUALITY_PATTERNS.cleanNaming.test(response)) qualityScore += 25
        if (CODE_QUALITY_PATTERNS.modernSyntax.test(response)) qualityScore += 25
        if (CODE_QUALITY_PATTERNS.functionDeclaration.test(response)) qualityScore += 25
        if (response.length > 50 && response.length < 3000) qualityScore += 25
        score = qualityScore
        feedback = qualityScore >= 75 ? 'Clean, readable code' : 'Code readability could be improved'
        if (qualityScore >= 75) strengths.push('Writes clean, well-structured code')
        break
      }

      case 'correctness': {
        const hasFunction = CODE_QUALITY_PATTERNS.functionDeclaration.test(response)
        const hasReturn = /return\s/i.test(response)
        const hasLogic = response.length > 80
        score = (hasFunction ? 35 : 5) + (hasReturn ? 30 : 5) + (hasLogic ? 35 : 10)
        feedback = hasFunction && hasReturn ? 'Solution appears correct' : 'Solution may be incomplete'
        break
      }

      case 'efficiency': {
        const usesSet = /Set\(|set\(|dict\(|hash|O\(n\)|O\(1\)/i.test(response)
        const usesHashMap = /Map\(|map\(|dict|{}|hash/i.test(response)
        score = (usesSet || usesHashMap) ? 100 : 40
        feedback = (usesSet || usesHashMap) ? 'Efficient O(n) approach' : 'Consider using a Set or Map for O(n) lookup'
        if (usesSet || usesHashMap) strengths.push('Chooses efficient data structures')
        break
      }

      case 'edge cases': {
        const checksEmpty = /if\s*\(!|if\s*\(.*length|if\s*\(.*==\s*0|not\s|None|null|undefined|empty/i.test(response)
        const checksMissing = /get\(|\.get|hasOwnProperty|in\s+|KeyError|missing|default/i.test(response)
        score = (checksEmpty ? 50 : 10) + (checksMissing ? 50 : 10)
        feedback = checksEmpty ? 'Handles edge cases well' : 'Consider edge cases like empty inputs or missing keys'
        break
      }

      case 'responsive breakpoints': {
        const hasMediaQuery = /@media|min-width|max-width|grid-template-columns.*repeat.*auto/i.test(response)
        const hasBreakpoints = /640|768|1024|sm:|md:|lg:/i.test(response)
        score = (hasMediaQuery ? 50 : 10) + (hasBreakpoints ? 50 : 10)
        feedback = hasMediaQuery && hasBreakpoints ? 'Correct responsive breakpoints' : 'Breakpoints need adjustment'
        break
      }

      case 'equal heights': {
        const usesGrid = /display:\s*grid|grid-template/i.test(response)
        const usesFlex = /display:\s*flex|align-items:\s*stretch/i.test(response)
        score = (usesGrid || usesFlex) ? 100 : 30
        feedback = (usesGrid || usesFlex) ? 'Equal height cards achieved' : 'Use CSS Grid or Flexbox stretch for equal heights'
        break
      }

      case 'modern css': {
        const usesGrid = /display:\s*grid/i.test(response)
        const usesFlex = /display:\s*flex/i.test(response)
        const usesCustomProps = /var\(--|--\w+:/i.test(response)
        score = (usesGrid ? 50 : 0) + (usesFlex ? 30 : 0) + (usesCustomProps ? 20 : 10)
        if (!usesGrid && !usesFlex) score = 20
        feedback = usesGrid ? 'Excellent use of CSS Grid' : usesFlex ? 'Good use of Flexbox' : 'Use modern CSS Grid or Flexbox'
        if (usesGrid) strengths.push('Proficient with modern CSS Grid')
        break
      }

      case 'visual polish': {
        const hasShadow = /box-shadow|shadow/i.test(response)
        const hasRadius = /border-radius|rounded/i.test(response)
        const hasSpacing = /gap|padding|margin/i.test(response)
        score = (hasShadow ? 35 : 5) + (hasRadius ? 35 : 5) + (hasSpacing ? 30 : 5)
        feedback = (hasShadow && hasRadius) ? 'Good visual polish' : 'Add shadow and border-radius for polish'
        break
      }

      default: {
        // Generic code evaluation
        const hasCode = response.length > 50
        const hasExplanation = response.split(/\s+/).length > 15
        score = (hasCode ? 50 : 15) + (hasExplanation ? 50 : 15)
        feedback = hasCode ? 'Response contains code' : 'More code expected'
      }
    }

    // Normalize score to criterion weight
    const normalizedScore = Math.round((score / 100) * c.weight)
    criteriaScores.push({
      criterion: c.criterion,
      score: normalizedScore,
      maxScore: c.weight,
      feedback,
    })
  }

  const totalScore = Math.min(100, criteriaScores.reduce((sum, c) => sum + c.score, 0))
  const badgeLevel = getBadgeLevel(totalScore)

  if (strengths.length === 0) {
    if (totalScore >= 50) strengths.push('Shows foundational understanding of the concept')
    else strengths.push('Attempted the challenge — keep practicing!')
  }
  if (improvements.length === 0 && totalScore < 90) {
    improvements.push('Review the specific concepts tested in this challenge')
  }

  const overallFeedback = totalScore >= 90
    ? `Outstanding work! You demonstrated expert-level ${challengeTitle.toLowerCase()} skills. Your SkillDNA badge: Diamond 💎`
    : totalScore >= 75
    ? `Great job! You showed strong proficiency. Your SkillDNA badge: Gold 🥇`
    : totalScore >= 55
    ? `Good effort! You have a solid foundation. Your SkillDNA badge: Silver 🥈. Review the feedback to level up.`
    : `You're on the right track! Your SkillDNA badge: Bronze 🥉. Focus on the improvement areas and try again in 7 days.`

  return { score: totalScore, badgeLevel, criteriaScores, overallFeedback, strengths, improvements }
}

function evaluateWritingChallenge(
  response: string,
  criteria: EvaluationCriterion[],
  challengeTitle: string
): EvaluationResult {
  const lower = response.toLowerCase()
  const wordCount = response.split(/\s+/).filter(w => w.length > 0).length
  const criteriaScores: EvaluationResult['criteriaScores'] = []
  const strengths: string[] = []
  const improvements: string[] = []

  for (const c of criteria) {
    let score = 0
    let feedback = ''

    switch (c.criterion.toLowerCase()) {
      case 'persuasion': {
        const persuasiveCount = WRITING_QUALITY.persuasiveWords.filter(w => lower.includes(w)).length
        const hasEmotionalAppeal = /imagine|picture|feel|experience|enjoy|love/i.test(response)
        const hasBenefitFocus = /you|your|you'll|you can|never.*again|no more/i.test(response)
        score = Math.min(100, persuasiveCount * 15 + (hasEmotionalAppeal ? 25 : 0) + (hasBenefitFocus ? 25 : 0))
        feedback = score >= 70 ? 'Compelling and persuasive' : 'Add more benefit-focused language'
        if (score >= 70) strengths.push('Strong persuasive writing skills')
        break
      }

      case 'clarity': {
        const isRightLength = wordCount >= 40 && wordCount <= 100
        const hasClearStructure = response.includes('.') && response.split('.').length >= 2
        const mentionsFeatures = /battery|waterproof|charge|solar|device|fold/i.test(response)
        score = (isRightLength ? 35 : 15) + (hasClearStructure ? 30 : 10) + (mentionsFeatures ? 35 : 10)
        feedback = score >= 70 ? 'Clear and well-structured' : 'Ensure key features are clearly communicated'
        break
      }

      case 'brand voice': {
        let toneScore = 0
        for (const [tone, words] of Object.entries(WRITING_QUALITY.brandToneWords)) {
          const matches = words.filter(w => lower.includes(w)).length
          toneScore += matches * 12
        }
        score = Math.min(100, toneScore + 10)
        feedback = score >= 60 ? 'Good brand voice alignment' : 'Better align with the specified brand tone'
        if (score >= 60) strengths.push('Adapts writing to match brand voice')
        else improvements.push('Practice writing in different brand tones')
        break
      }

      case 'cta effectiveness': {
        const hasCTA = WRITING_QUALITY.ctaPhrases.some(p => lower.includes(p))
        const hasUrgency = /now|today|limited|don't miss|hurry|while/i.test(response)
        score = (hasCTA ? 60 : 10) + (hasUrgency ? 40 : 10)
        feedback = hasCTA ? 'Strong call to action' : 'Add a clear, actionable CTA'
        if (!hasCTA) improvements.push('Always end product descriptions with a clear call to action')
        break
      }

      case 'color psychology': {
        const mentionsColor = /#[0-9a-fA-F]{3,6}|rgb|hsl|blue|green|purple|orange|teal|coral/i.test(response)
        const explainsPsychology = /trust|calm|energy|youth|fun|playful|serious|professional|warm|cool|vibrant/i.test(response)
        score = (mentionsColor ? 45 : 10) + (explainsPsychology ? 55 : 10)
        feedback = (mentionsColor && explainsPsychology) ? 'Excellent color rationale' : 'Explain the psychology behind your color choices'
        if (mentionsColor && explainsPsychology) strengths.push('Deep understanding of color psychology')
        break
      }

      case 'audience awareness': {
        const mentionsAudience = /teen|young|13|18|student|school|gen z|youth|adolescent/i.test(response)
        const mentionsContext = /kenya|african|mobile|phone|app|digital|social/i.test(response)
        score = (mentionsAudience ? 50 : 10) + (mentionsContext ? 50 : 10)
        feedback = mentionsAudience ? 'Good audience awareness' : 'Consider the specific target audience more deeply'
        break
      }

      case 'typography choice': {
        const mentionsFont = /font|typeface|sans-serif|serif|inter|poppins|roboto|montserrat|nunito|lato|open sans|raleway|heading|body|display/i.test(response)
        const explainsPairing = /pair|contrast|complement|readable|legible|hierarchy|weight/i.test(response)
        score = (mentionsFont ? 55 : 10) + (explainsPairing ? 45 : 10)
        feedback = mentionsFont ? 'Good typography recommendation' : 'Include specific font recommendations'
        break
      }

      case 'reasoning depth': {
        const hasWhy = /because|since|this.*works|the reason|this creates|this conveys|this evokes/i.test(response)
        const hasSpecifics = wordCount >= 50
        const hasStructure = WRITING_QUALITY.structureMarkers.some(m => lower.includes(m))
        score = (hasWhy ? 40 : 10) + (hasSpecifics ? 30 : 10) + (hasStructure ? 30 : 10)
        feedback = hasWhy ? 'Good reasoning depth' : 'Explain WHY your choices work, not just WHAT they are'
        if (hasWhy && hasSpecifics) strengths.push('Articulates design reasoning clearly')
        else improvements.push('Always explain the "why" behind design decisions')
        break
      }

      default: {
        score = Math.min(100, wordCount * 2)
        feedback = wordCount >= 30 ? 'Adequate response' : 'Response is too brief'
      }
    }

    const normalizedScore = Math.round((score / 100) * c.weight)
    criteriaScores.push({
      criterion: c.criterion,
      score: normalizedScore,
      maxScore: c.weight,
      feedback,
    })
  }

  const totalScore = Math.min(100, criteriaScores.reduce((sum, c) => sum + c.score, 0))
  const badgeLevel = getBadgeLevel(totalScore)

  if (strengths.length === 0) strengths.push('Shows creative thinking')
  if (improvements.length === 0 && totalScore < 90) improvements.push('Practice writing under time constraints')

  const overallFeedback = totalScore >= 90
    ? `Exceptional writing! You demonstrated mastery. SkillDNA badge: Diamond 💎`
    : totalScore >= 75
    ? `Strong performance! You write with clarity and purpose. SkillDNA badge: Gold 🥇`
    : totalScore >= 55
    ? `Good foundation! Focus on the feedback areas to improve. SkillDNA badge: Silver 🥈`
    : `Keep practicing! Writing improves with repetition. SkillDNA badge: Bronze 🥉`

  return { score: totalScore, badgeLevel, criteriaScores, overallFeedback, strengths, improvements }
}

function evaluateAnalysisChallenge(
  response: string,
  criteria: EvaluationCriterion[],
  challengeTitle: string
): EvaluationResult {
  const lower = response.toLowerCase()
  const criteriaScores: EvaluationResult['criteriaScores'] = []
  const strengths: string[] = []
  const improvements: string[] = []

  for (const c of criteria) {
    let score = 0
    let feedback = ''

    switch (c.criterion.toLowerCase()) {
      case 'insight quality': {
        const mentionsReturnRate = /return rate|return.*increas|return.*spike|return.*ris|15%|12%/i.test(response)
        const mentionsVolume = /order.*increas|volume.*grew|more orders|1,?200|1,?100/i.test(response)
        const connectsBoth = mentionsReturnRate && mentionsVolume
        score = (mentionsReturnRate ? 40 : 10) + (mentionsVolume ? 30 : 10) + (connectsBoth ? 30 : 0)
        feedback = connectsBoth ? 'Excellent insight — connected return rate to volume growth' : 'Look for correlations between metrics'
        if (connectsBoth) strengths.push('Strong analytical thinking — identifies correlations')
        break
      }

      case 'root cause analysis': {
        const mentionsCause = ANALYSIS_QUALITY.causalLanguage.test(response)
        const mentionsQuality = /quality|fulfillment|shipping|customer.*service|product|defect|rush|capacity/i.test(response)
        score = (mentionsCause ? 50 : 15) + (mentionsQuality ? 50 : 15)
        feedback = mentionsCause && mentionsQuality ? 'Strong root cause analysis' : 'Dig deeper into potential causes'
        if (mentionsCause && mentionsQuality) strengths.push('Identifies root causes, not just symptoms')
        break
      }

      case 'recommendation': {
        const hasRecommendation = ANALYSIS_QUALITY.recommendations.test(response)
        const isSpecific = ANALYSIS_QUALITY.specificity.test(response)
        const isActionable = /implement|hire|invest|audit|review|track|monitor|set up|create|establish/i.test(response)
        score = (hasRecommendation ? 35 : 10) + (isSpecific ? 35 : 10) + (isActionable ? 30 : 10)
        feedback = hasRecommendation && isActionable ? 'Actionable recommendation' : 'Make recommendations more specific and actionable'
        if (isActionable) strengths.push('Provides actionable business recommendations')
        else improvements.push('Always tie analysis to specific, actionable next steps')
        break
      }

      case 'conciseness': {
        const wordCount = response.split(/\s+/).length
        const isWithinLimit = wordCount >= 30 && wordCount <= 150
        const usesData = ANALYSIS_QUALITY.dataReferences.test(response)
        score = (isWithinLimit ? 60 : 20) + (usesData ? 40 : 10)
        feedback = isWithinLimit ? 'Concise and data-driven' : wordCount < 30 ? 'Too brief — include more detail' : 'Try to be more concise'
        break
      }

      default: {
        const hasSubstance = response.split(/\s+/).length > 20
        score = hasSubstance ? 70 : 30
        feedback = hasSubstance ? 'Adequate analysis' : 'Provide more detailed analysis'
      }
    }

    const normalizedScore = Math.round((score / 100) * c.weight)
    criteriaScores.push({
      criterion: c.criterion,
      score: normalizedScore,
      maxScore: c.weight,
      feedback,
    })
  }

  const totalScore = Math.min(100, criteriaScores.reduce((sum, c) => sum + c.score, 0))
  const badgeLevel = getBadgeLevel(totalScore)

  if (strengths.length === 0) strengths.push('Shows analytical thinking')
  if (improvements.length === 0 && totalScore < 90) improvements.push('Practice data interpretation with real datasets')

  const overallFeedback = totalScore >= 90
    ? `Outstanding analysis! You think like a senior data analyst. SkillDNA badge: Diamond 💎`
    : totalScore >= 75
    ? `Strong analytical skills! You extract meaningful insights. SkillDNA badge: Gold 🥇`
    : totalScore >= 55
    ? `Good start! Work on connecting data points to business impact. SkillDNA badge: Silver 🥈`
    : `Keep learning! Focus on identifying trends and their causes. SkillDNA badge: Bronze 🥉`

  return { score: totalScore, badgeLevel, criteriaScores, overallFeedback, strengths, improvements }
}

/**
 * Main evaluation function — routes to the appropriate evaluator based on challenge type
 */
export function evaluateResponse(
  response: string,
  challengeType: string,
  criteria: EvaluationCriterion[],
  challengeTitle: string,
  timeTaken: number,
  timeLimit: number
): EvaluationResult {
  // Time penalty: if they took more than the time limit, reduce score
  const timeRatio = timeTaken / timeLimit
  let timePenalty = 0
  if (timeRatio > 1.5) timePenalty = 15
  else if (timeRatio > 1.2) timePenalty = 8
  else if (timeRatio > 1.0) timePenalty = 3

  // Empty or very short responses
  if (!response || response.trim().length < 10) {
    return {
      score: 0,
      badgeLevel: 'bronze',
      criteriaScores: criteria.map(c => ({
        criterion: c.criterion,
        score: 0,
        maxScore: c.weight,
        feedback: 'No meaningful response provided',
      })),
      overallFeedback: 'Please provide a response to the challenge. Even a partial answer helps us evaluate your skills.',
      strengths: [],
      improvements: ['Complete the challenge with a full response'],
    }
  }

  let result: EvaluationResult

  switch (challengeType) {
    case 'code':
      result = evaluateCodeChallenge(response, criteria, challengeTitle)
      break
    case 'writing':
    case 'design':
      result = evaluateWritingChallenge(response, criteria, challengeTitle)
      break
    case 'analysis':
      result = evaluateAnalysisChallenge(response, criteria, challengeTitle)
      break
    default:
      result = evaluateWritingChallenge(response, criteria, challengeTitle)
  }

  // Apply time penalty
  if (timePenalty > 0) {
    result.score = Math.max(0, result.score - timePenalty)
    result.badgeLevel = getBadgeLevel(result.score)
    if (timePenalty >= 10) {
      result.improvements.push(`Completed ${Math.round((timeRatio - 1) * 100)}% over the time limit — practice speed`)
    }
  }

  // Time bonus for fast completion
  if (timeRatio < 0.5 && result.score >= 70) {
    result.strengths.push('Completed well under the time limit — impressive speed!')
  }

  return result
}

/**
 * Generate a challenge for a specific skill (selects from available challenges)
 */
export function selectChallenge(
  challenges: Array<{ id: string; skill_name: string; difficulty: string; title: string }>,
  previousAttemptIds: string[] = []
): typeof challenges[0] | null {
  // Filter out previously attempted challenges
  const available = challenges.filter(c => !previousAttemptIds.includes(c.id))
  if (available.length === 0) return challenges[0] || null // Allow retake if all attempted
  
  // Random selection from available
  return available[Math.floor(Math.random() * available.length)]
}
