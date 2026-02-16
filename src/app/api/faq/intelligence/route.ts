import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// Stop words to ignore during matching
const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they', 'them', 'their', 'he', 'she', 'him', 'her', 'his', 'about', 'up', 'out', 'then', 'there', 'here'])

// Calculate Levenshtein distance for typo tolerance
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

// Fuzzy match with typo tolerance
function fuzzyMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true
  if (word1.length < 4 || word2.length < 4) return false
  const maxDistance = Math.floor(Math.max(word1.length, word2.length) * 0.25) // Allow 25% typos
  return levenshteinDistance(word1, word2) <= maxDistance
}

// Synonym / alias mappings to broaden understanding
const SYNONYMS: Record<string, string[]> = {
  'paid': ['pay', 'payment', 'payout', 'earn', 'earnings', 'income', 'money', 'receive', 'compensate', 'compensation', 'salary', 'wage', 'cash', 'get paid', 'withdraw'],
  'fee': ['fees', 'charge', 'charges', 'cost', 'costs', 'price', 'pricing', 'commission', 'deduction', 'percent', 'percentage', 'rate'],
  'escrow': ['escrow', 'hold', 'holding', 'secure', 'secured', 'protection', 'safeguard', 'trust'],
  'wallet': ['wallet', 'balance', 'funds', 'account', 'top up', 'topup', 'deposit', 'money'],
  'proposal': ['proposal', 'proposals', 'bid', 'bids', 'apply', 'application', 'submit', 'cover letter'],
  'job': ['job', 'jobs', 'project', 'projects', 'gig', 'gigs', 'work', 'task', 'tasks', 'hustle', 'hustles', 'hire', 'hiring'],
  'profile': ['profile', 'account', 'settings', 'bio', 'portfolio', 'avatar', 'photo'],
  'verify': ['verify', 'verification', 'verified', 'identity', 'id', 'confirm', 'validate', 'validated'],
  'dispute': ['dispute', 'problem', 'issue', 'conflict', 'complaint', 'refund', 'disagreement'],
  'pro': ['pro', 'premium', 'upgrade', 'subscription', 'plan', 'subscribe', 'membership'],
  'cancel': ['cancel', 'cancellation', 'unsubscribe', 'stop', 'end', 'terminate', 'quit'],
  'sign up': ['sign up', 'signup', 'register', 'registration', 'create account', 'join', 'get started', 'start', 'begin', 'onboard'],
  'mpesa': ['mpesa', 'm-pesa', 'safaricom', 'stk', 'paybill', 'till', 'mobile money'],
  'secure': ['secure', 'security', 'safe', 'safety', 'privacy', 'private', 'encrypt', 'encrypted', 'protection', 'data'],
  'score': ['score', 'hustle score', 'rating', 'reputation', 'trust', 'rank', 'ranking'],
  'fast': ['fast', 'quick', 'quickly', 'instant', 'instantly', 'speed', 'how long', 'time', 'duration', 'soon'],
  'delete': ['delete', 'remove', 'deactivate', 'close', 'shut down'],
}

// FAQ knowledge base — canonical answers
const FAQ_KNOWLEDGE_BASE = [
  { id: 'fee-1', category: 'fees', question: 'What is the service fee?', answer: 'HustleKE charges 6% on the Free plan and 4% on the Pro plan per completed transaction. This is deducted from the project payment when funds are released from escrow.', keywords: ['fee', 'charge', 'percent', 'cost', 'service fee', 'how much', 'deduct', 'commission'] },
  { id: 'fee-2', category: 'fees', question: 'Are there hidden fees?', answer: 'No. The service fee is the only platform charge. Standard M-Pesa transaction fees from Safaricom may apply for withdrawals.', keywords: ['hidden', 'extra', 'other fee', 'additional', 'surprise'] },
  { id: 'fee-3', category: 'fees', question: 'How does Pro reduce my fees?', answer: 'Pro plan members pay only 4% per transaction instead of 6%. On a KES 50,000 project, that saves you KES 1,000. The Pro subscription costs KES 500/month, so it pays for itself with one decent project.', keywords: ['pro', 'reduce', 'save', 'discount', 'lower fee', 'upgrade'] },
  { id: 'pay-1', category: 'payments', question: 'How does escrow work?', answer: 'When a client accepts your proposal, they fund the escrow with M-Pesa. The money is held securely until you complete the work and the client approves it. Then funds are released to your wallet instantly.', keywords: ['escrow', 'hold', 'secure', 'protect', 'safe', 'fund'] },
  { id: 'pay-2', category: 'payments', question: 'How fast do I get paid?', answer: 'Once the client approves your work, payment is released to your M-Pesa wallet instantly — usually within seconds.', keywords: ['paid', 'fast', 'instant', 'when', 'receive', 'payout', 'withdraw', 'mpesa', 'm-pesa', 'get paid'] },
  { id: 'pay-3', category: 'payments', question: 'What payment methods are accepted?', answer: 'All payments on HustleKE are processed through M-Pesa. You top up your wallet via M-Pesa STK Push, and withdraw to your M-Pesa number.', keywords: ['payment method', 'mpesa', 'm-pesa', 'bank', 'visa', 'card', 'pay how'] },
  { id: 'pay-4', category: 'payments', question: 'How do I top up my wallet?', answer: 'Go to Dashboard > Wallet, enter your M-Pesa phone number and amount, then click Top Up. You will receive an STK push on your phone to confirm the transaction.', keywords: ['top up', 'deposit', 'add money', 'fund', 'wallet', 'load'] },
  { id: 'plan-1', category: 'plans', question: 'Can I cancel Pro anytime?', answer: 'Yes! Pro is a monthly subscription with no lock-in. Cancel anytime from Dashboard > Settings > Subscription. You keep all Pro benefits until your current billing period ends.', keywords: ['cancel', 'stop', 'unsubscribe', 'quit', 'end subscription'] },
  { id: 'plan-2', category: 'plans', question: 'What happens when Pro expires?', answer: 'If auto-renew is on and your wallet has funds, it renews automatically. If not, you get a 3-day grace period to top up. After that, you revert to the Free plan.', keywords: ['expire', 'renew', 'auto', 'grace', 'lapse', 'end'] },
  { id: 'plan-3', category: 'plans', question: 'Is there a free trial for Pro?', answer: 'We offer promo codes for discounted or free first months. Use code EARLYBIRD for a free first month when subscribing in Dashboard > Settings > Subscription.', keywords: ['trial', 'free', 'promo', 'code', 'coupon', 'test', 'try'] },
  { id: 'plan-4', category: 'plans', question: 'What does Enterprise include?', answer: 'Enterprise gives you custom fee rates from 3%, unlimited proposals, team management, bulk hiring, API access, a dedicated account manager, and 2-hour support SLAs. Contact sales to set up.', keywords: ['enterprise', 'team', 'bulk', 'company', 'business', 'custom', 'corporate'] },
  { id: 'acc-1', category: 'account', question: 'How do I verify my account?', answer: 'Go to Dashboard > Settings and complete ID verification. You need a valid national ID or passport. Most verifications are processed within 24 hours.', keywords: ['verify', 'verification', 'id', 'identity', 'confirm', 'validate'] },
  { id: 'acc-2', category: 'account', question: 'How do I update my profile?', answer: 'Go to Dashboard > Settings > Profile tab. You can update your name, bio, skills, hourly rate, education, certifications, and portfolio there.', keywords: ['update', 'edit', 'change', 'profile', 'information', 'details'] },
  { id: 'acc-3', category: 'account', question: 'What is the Hustle Score?', answer: 'Hustle Score is your trust rating (0-100) based on completed jobs, reviews, response time, verification status, and platform activity. Higher scores get priority in search results and job matching.', keywords: ['hustle score', 'score', 'rating', 'trust', 'reputation', 'rank'] },
  { id: 'job-1', category: 'jobs', question: 'How do I write a good proposal?', answer: 'Address the client\'s specific needs, showcase relevant experience, be clear about your timeline and approach, set a competitive bid, and use the AI Proposal Polisher to optimize your writing.', keywords: ['proposal', 'write', 'apply', 'bid', 'submit', 'cover letter', 'good proposal'] },
  { id: 'job-2', category: 'jobs', question: 'How many proposals can I send per day?', answer: 'Free plan users can send up to 10 proposals per day. Pro plan users get 20 proposals per day. Enterprise users have unlimited proposals.', keywords: ['proposal limit', 'how many', 'per day', 'daily', 'limit', 'maximum'] },
  { id: 'job-3', category: 'jobs', question: 'What if a client doesn\'t respond?', answer: 'Send a polite follow-up message after 3 days. If there is no response after 7 days, you can withdraw your proposal and apply to other jobs. Your proposal count is restored when you withdraw.', keywords: ['no response', 'client silent', 'not responding', 'ignore', 'ghost', 'wait'] },
  { id: 'safe-1', category: 'safety', question: 'What if there is a dispute?', answer: 'Open a dispute from Dashboard > Escrow. Our resolution team reviews evidence from both sides within 48 hours. With escrow protection, funds stay safe until the dispute is resolved — by release, refund, or fair split.', keywords: ['dispute', 'problem', 'issue', 'conflict', 'disagree', 'complaint', 'refund'] },
  { id: 'safe-2', category: 'safety', question: 'Is my data secure?', answer: 'Yes. We use bank-level encryption, Supabase Row Level Security policies, and never share your personal information with third parties. All API routes are rate-limited and validated.', keywords: ['data', 'secure', 'privacy', 'safe', 'encrypt', 'hack', 'protect'] },
]

// Extract meaningful words from a query (removing stop words)
function extractKeywords(text: string): string[] {
  return text.toLowerCase().replace(/[?!.,;:'"()\[\]{}]/g, '').split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w))
}

// Expand a word using synonym map — EXACT matches only (no substring)
function expandWithSynonyms(word: string): string[] {
  const expanded = [word]
  for (const [, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some(s => s === word)) {
      expanded.push(...synonyms)
    }
  }
  return Array.from(new Set(expanded))
}

// Check if two words are a meaningful match (with typo tolerance)
function wordsMatch(queryWord: string, targetWord: string): boolean {
  if (queryWord === targetWord) return true
  // Fuzzy match for typos
  if (fuzzyMatch(queryWord, targetWord)) return true
  // Only allow stem-like matching for words >= 4 chars
  if (queryWord.length >= 4 && targetWord.length >= 4) {
    // One must start with the other (e.g. "pay" matches "payment", "bid" matches "bidding")
    if (targetWord.startsWith(queryWord) || queryWord.startsWith(targetWord)) return true
  }
  return false
}

// Intent definitions — each has key_words (must ALL appear in query) + optional exact phrases
const INTENT_DEFS: Array<{ intent: string; faqIds: string[]; phrases: string[]; keywordSets: string[][] }> = [
  { intent: 'bidding_budget', faqIds: [], phrases: ['bid more than budget', 'bid over budget', 'bid above budget', 'overbid', 'bid too high', 'bid too much', 'budget limit'], keywordSets: [['bid', 'budget'], ['bid', 'more'], ['bid', 'higher'], ['bid', 'exceed'], ['bid', 'above'], ['bid', 'over']] },
  { intent: 'contact_sharing', faqIds: [], phrases: ['share contact', 'share phone', 'share email', 'exchange contact', 'give number', 'off platform', 'outside platform', 'direct contact', 'share personal', 'whatsapp'], keywordSets: [['share', 'contact'], ['share', 'phone'], ['share', 'email'], ['share', 'number'], ['exchange', 'contact'], ['allowed', 'contact'], ['personal', 'contact']] },
  { intent: 'getting_paid', faqIds: ['pay-2'], phrases: ['get paid', 'receive payment', 'receive money', 'earn money', 'how paid', 'when paid'], keywordSets: [['get', 'paid'], ['receive', 'payment'], ['earn', 'money']] },
  { intent: 'service_fee', faqIds: ['fee-1'], phrases: ['service fee', 'platform fee', 'transaction fee', 'how much charge'], keywordSets: [['service', 'fee'], ['platform', 'fee'], ['how', 'much', 'charge']] },
  { intent: 'escrow_system', faqIds: ['pay-1'], phrases: ['escrow work', 'escrow protect', 'payment protection', 'money safe', 'funds held'], keywordSets: [['escrow', 'work'], ['escrow', 'protect']] },
  { intent: 'wallet_topup', faqIds: ['pay-4'], phrases: ['top up', 'add money', 'fund wallet', 'deposit money', 'load wallet'], keywordSets: [['top', 'up'], ['add', 'money'], ['fund', 'wallet']] },
  { intent: 'cancel_sub', faqIds: ['plan-1'], phrases: ['cancel pro', 'cancel subscription', 'stop subscription', 'unsubscribe'], keywordSets: [['cancel', 'pro'], ['cancel', 'subscription'], ['stop', 'subscription']] },
  { intent: 'hustle_score', faqIds: ['acc-3'], phrases: ['hustle score', 'trust score', 'trust rating'], keywordSets: [['hustle', 'score'], ['trust', 'score']] },
  { intent: 'writing_proposals', faqIds: ['job-1'], phrases: ['write proposal', 'good proposal', 'winning proposal', 'proposal tips'], keywordSets: [['write', 'proposal'], ['good', 'proposal'], ['proposal', 'tips']] },
  { intent: 'dispute_process', faqIds: ['safe-1'], phrases: ['open dispute', 'file dispute', 'raise dispute', 'report issue', 'report problem'], keywordSets: [['open', 'dispute'], ['file', 'dispute'], ['report', 'issue']] },
  { intent: 'hidden_fees', faqIds: ['fee-2'], phrases: ['hidden fee', 'extra charge', 'additional cost', 'surprise fee'], keywordSets: [['hidden', 'fee'], ['extra', 'charge']] },
  { intent: 'pro_plan', faqIds: ['fee-3', 'plan-1'], phrases: ['pro plan', 'pro benefit', 'upgrade pro', 'pro worth'], keywordSets: [['pro', 'plan'], ['upgrade', 'pro'], ['pro', 'benefit']] },
  { intent: 'verification', faqIds: ['acc-1'], phrases: ['verify account', 'verify identity', 'id verification', 'account verification'], keywordSets: [['verify', 'account'], ['verify', 'identity']] },
  { intent: 'profile_update', faqIds: ['acc-2'], phrases: ['update profile', 'edit profile', 'change profile', 'profile settings'], keywordSets: [['update', 'profile'], ['edit', 'profile']] },
  { intent: 'client_no_response', faqIds: ['job-3'], phrases: ['client not respond', 'client silent', 'no response from client', 'client ignore', 'client ghost'], keywordSets: [['client', 'respond'], ['client', 'silent'], ['client', 'ghost'], ['client', 'ignore']] },
  { intent: 'data_security', faqIds: ['safe-2'], phrases: ['data secure', 'data safe', 'data privacy', 'information safe', 'is it safe'], keywordSets: [['data', 'secure'], ['data', 'safe'], ['data', 'privacy']] },
  { intent: 'free_trial', faqIds: ['plan-3'], phrases: ['free trial', 'try pro', 'test pro', 'promo code', 'discount code'], keywordSets: [['free', 'trial'], ['promo', 'code'], ['discount', 'code']] },
  { intent: 'payment_methods', faqIds: ['pay-3'], phrases: ['payment method', 'pay with', 'use visa', 'use card', 'use bank', 'use paypal', 'mpesa only'], keywordSets: [['payment', 'method'], ['use', 'paypal'], ['use', 'card'], ['use', 'visa'], ['use', 'bank']] },
  { intent: 'proposal_limits', faqIds: ['job-2'], phrases: ['proposal limit', 'how many proposal', 'proposals per day', 'daily limit'], keywordSets: [['proposal', 'limit'], ['proposals', 'per', 'day']] },
  // Additional intents for broader coverage
  { intent: 'tax_earnings', faqIds: [], phrases: ['pay tax', 'tax on earnings', 'vat', 'invoice', 'receipt', 'kra'], keywordSets: [['tax', 'earnings'], ['pay', 'tax'], ['tax', 'income'], ['kra']] },
  { intent: 'multiple_projects', faqIds: [], phrases: ['multiple projects', 'multiple jobs', 'at once', 'same time', 'simultaneous', 'how many jobs', 'job limit'], keywordSets: [['multiple', 'projects'], ['multiple', 'jobs'], ['many', 'jobs'], ['simultaneous'], ['work', 'multiple']] },
  { intent: 'work_rejection', faqIds: [], phrases: ['reject my work', 'rejects work', 'bad quality', 'poor work', 'not satisfied', 'revision', 'redo work', 'incomplete work'], keywordSets: [['reject', 'work'], ['client', 'reject'], ['bad', 'quality'], ['poor', 'work'], ['request', 'revision'], ['not', 'satisfied'], ['redo', 'work']] },
  { intent: 'rules_policies', faqIds: [], phrases: ['am i allowed', 'is it allowed', 'is it okay', 'permitted', 'rules', 'policy', 'terms of service', 'guidelines'], keywordSets: [['allowed'], ['permitted'], ['rules'], ['policy'], ['guidelines']] },
  { intent: 'password_account', faqIds: [], phrases: ['change password', 'forgot password', 'reset password', 'change email', 'change phone', 'update email', 'update phone'], keywordSets: [['change', 'password'], ['forgot', 'password'], ['reset', 'password'], ['change', 'email'], ['change', 'phone']] },
  { intent: 'minimum_bid', faqIds: [], phrases: ['minimum bid', 'minimum amount', 'minimum budget', 'lowest bid', 'minimum project'], keywordSets: [['minimum', 'bid'], ['minimum', 'amount'], ['lowest', 'bid']] },
  { intent: 'multiple_accounts', faqIds: [], phrases: ['multiple account', 'two account', 'second account'], keywordSets: [['multiple', 'account'], ['two', 'account'], ['second', 'account']] },
  { intent: 'about_platform', faqIds: [], phrases: ['about hustleke', 'what is hustleke', 'tell me about'], keywordSets: [['about', 'hustleke'], ['what', 'hustleke']] },
]

// Detect intent using both exact phrases AND keyword-set matching (gap-tolerant)
function detectIntent(text: string): { intent: string; faqIds: string[] } | null {
  const lower = text.toLowerCase().trim()
  const words = extractKeywords(text)

  for (const def of INTENT_DEFS) {
    // 1. Check exact phrases
    for (const phrase of def.phrases) {
      if (lower.includes(phrase)) {
        return { intent: def.intent, faqIds: def.faqIds }
      }
    }

    // 2. Check keyword sets — ALL words in a set must appear in the query (in any order, any distance apart)
    for (const kwSet of def.keywordSets) {
      const allPresent = kwSet.every(kw => {
        if (kw.length <= 3) return lower.includes(kw)
        // For longer words, check with stem matching
        return words.some(w => wordsMatch(w, kw)) || lower.includes(kw)
      })
      if (allPresent) {
        return { intent: def.intent, faqIds: def.faqIds }
      }
    }
  }

  return null
}

// Robust keyword + synonym + word-overlap matching (strict — no accidental substring)
function scoreQuestion(text: string, faq: typeof FAQ_KNOWLEDGE_BASE[number]): number {
  const queryWords = extractKeywords(text)
  if (queryWords.length === 0) return 0

  let score = 0
  const lower = text.toLowerCase().trim()

  // 1. Direct keyword match (multi-word keywords weighted higher)
  for (const keyword of faq.keywords) {
    if (lower.includes(keyword.toLowerCase())) {
      score += keyword.split(' ').length * 3
    }
  }

  // 2. Word-by-word match against question text (strict matching)
  const faqQuestionWords = extractKeywords(faq.question)
  let questionWordMatches = 0
  for (const qw of queryWords) {
    const expanded = expandWithSynonyms(qw)
    for (const fqw of faqQuestionWords) {
      if (expanded.some(ew => wordsMatch(ew, fqw))) {
        questionWordMatches++
        break
      }
    }
  }
  score += questionWordMatches * 2

  // 3. Word-by-word match against answer text (strict, lower weight)
  const faqAnswerWords = extractKeywords(faq.answer)
  let answerWordMatches = 0
  for (const qw of queryWords) {
    const expanded = expandWithSynonyms(qw)
    for (const aw of faqAnswerWords) {
      if (expanded.some(ew => wordsMatch(ew, aw))) {
        answerWordMatches++
        break
      }
    }
  }
  score += answerWordMatches * 0.3

  // 4. Synonym expansion: query word must EXACTLY match a FAQ keyword
  for (const qw of queryWords) {
    const expanded = expandWithSynonyms(qw)
    for (const keyword of faq.keywords) {
      if (expanded.includes(keyword.toLowerCase())) {
        score += 2
      }
    }
  }

  // 5. Relevance ratio — penalize low overlap (long queries matching 1 word score less)
  if (queryWords.length > 0) {
    const totalMatched = questionWordMatches + Math.min(answerWordMatches, 2)
    const ratio = totalMatched / queryWords.length
    score *= (0.4 + ratio * 0.6) // Scale: 40% base + up to 60% for full overlap
  }

  return score
}

// Find best FAQ match — requires higher threshold for longer queries
function matchQuestion(text: string): typeof FAQ_KNOWLEDGE_BASE[number] | null {
  const lower = text.toLowerCase().trim()
  if (lower.length < 2) return null

  // First check intent phrases — if we detect an intent with a known FAQ, use it
  const intent = detectIntent(text)
  if (intent && intent.faqIds.length > 0) {
    const faq = FAQ_KNOWLEDGE_BASE.find(f => f.id === intent.faqIds[0])
    if (faq) return faq
  }

  let bestMatch: typeof FAQ_KNOWLEDGE_BASE[number] | null = null
  let bestScore = 0

  for (const faq of FAQ_KNOWLEDGE_BASE) {
    const score = scoreQuestion(text, faq)
    if (score > bestScore) {
      bestScore = score
      bestMatch = faq
    }
  }

  // Dynamic threshold: longer questions need higher scores to match
  const queryWords = extractKeywords(text)
  const threshold = Math.max(3, queryWords.length * 1.2)

  return bestScore >= threshold ? bestMatch : null
}

// Get multiple ranked matches
function matchQuestionMultiple(text: string, limit = 5): Array<typeof FAQ_KNOWLEDGE_BASE[number] & { score: number }> {
  const queryWords = extractKeywords(text)
  const minScore = Math.max(1.5, queryWords.length * 0.5)

  return FAQ_KNOWLEDGE_BASE
    .map(faq => ({ ...faq, score: scoreQuestion(text, faq) }))
    .filter(f => f.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// Platform context — used to generate answers for questions not in the KB
const PLATFORM_CONTEXT = `HustleKE is Kenya's freelance marketplace connecting skilled freelancers with clients. Key features:
- M-Pesa escrow payments protect both freelancers and clients
- Service fee: 6% (Free plan) or 4% (Pro plan, KES 500/month)
- Freelancers create profiles with skills, portfolio, and get a Hustle Score (0-100)
- Clients post jobs, review proposals, and hire the best fit
- Proposals: Free plan = 10/day, Pro = 20/day, Enterprise = unlimited
- All payments via M-Pesa (top up wallet, withdraw to M-Pesa)
- Escrow: client funds escrow → freelancer works → client approves → instant payout
- Disputes resolved by team within 48 hours
- Pro benefits: lower fees, more proposals, priority matching, analytics
- Enterprise: custom fees from 3%, unlimited proposals, team management, dedicated support
- Dashboard has: Jobs, Proposals, Escrow, Wallet, Messages, Settings
- Identity verification via national ID, phone number
- AI features: proposal polisher, smart job matching, answer intelligence`

// Generate a contextual answer when no KB match exists
function generateAnswer(question: string): string {
  const lower = question.toLowerCase()
  const words = extractKeywords(question)

  // Intent-first: check if a phrase-level intent was detected
  const intent = detectIntent(question)

  // Intent-specific generated answers for intents with no KB FAQ
  const intentAnswers: Record<string, string> = {
    'bidding_budget': 'Yes, you can bid more than the client\'s posted budget. Your bid represents the value you believe your work is worth. However, keep in mind that clients may prefer bids within their stated range. To increase your chances: explain why your higher bid is justified (specialized skills, faster delivery, better quality), reference past work that demonstrates value, and use the AI Proposal Polisher to make your case compelling. Some clients set low budgets and expect negotiation.',
    'contact_sharing': 'We strongly advise keeping all communication on the HustleKE platform. Sharing personal contact details (phone numbers, emails, WhatsApp) before a contract is in place puts you at risk — there is no escrow protection for off-platform agreements. Once a job is active with escrow funded, you can communicate through Dashboard > Messages. This protects both parties and creates a record in case of disputes. After successful project completion, it is your choice whether to exchange contacts for future work.',
    'getting_paid': 'On HustleKE, you get paid through M-Pesa escrow. When a client hires you, they fund the escrow. Once you complete the work and the client approves it, payment is released to your M-Pesa wallet instantly — usually within seconds. The platform charges a service fee (6% Free, 4% Pro). To withdraw, go to Dashboard > Wallet.',
    'service_fee': 'HustleKE charges a service fee on completed transactions: 6% on the Free plan and 4% on the Pro plan (KES 500/month). No hidden fees.',
    'escrow_system': 'Escrow holds funds securely until work is approved. Neither party can take it until the job is completed and the client approves.',
    'wallet_topup': 'Go to Dashboard > Wallet, enter your M-Pesa number and amount, then confirm via STK push.',
    'cancel_sub': 'Cancel anytime from Dashboard > Settings > Subscription. You keep Pro benefits until your current billing period ends.',
    'hustle_score': 'Hustle Score (0-100) is based on completed jobs, reviews, response time, verification, and activity. Higher scores = more visibility.',
    'writing_proposals': 'Address specific client needs, showcase relevant work, set a competitive bid, be clear on timeline, and use the AI Proposal Polisher.',
    'dispute_process': 'Open a dispute from Dashboard > Escrow. Our team reviews evidence within 48 hours. Funds stay safe until resolved.',
    'hidden_fees': 'No hidden fees. The service fee (6% Free / 4% Pro) is the only platform charge. M-Pesa withdrawal fees may apply from Safaricom.',
    'pro_plan': 'Pro costs KES 500/month: 4% fee, 20 proposals/day, priority matching, analytics, PRO badge. Try code EARLYBIRD for free first month.',
    'verification': 'Go to Dashboard > Settings, upload national ID or passport. Most verifications complete within 24 hours.',
    'profile_update': 'Go to Dashboard > Settings > Profile tab to update name, bio, skills, hourly rate, education, certifications, and portfolio.',
    'client_no_response': 'Send a polite follow-up after 3 days. If no response after 7 days, withdraw your proposal (count is restored) and apply elsewhere.',
    'data_security': 'Yes. Bank-level encryption, Row Level Security, rate limiting. We never share personal data with third parties.',
    'free_trial': 'Use promo code EARLYBIRD for a free first month of Pro. Apply it in Dashboard > Settings > Subscription.',
    'payment_methods': 'Currently all payments are via M-Pesa. Top up and withdraw through your M-Pesa number. Bank transfers coming soon.',
    'proposal_limits': 'Free plan: 10 proposals/day. Pro plan: 20/day. Enterprise: unlimited. Withdrawn proposals restore your daily count.',
    'tax_earnings': 'HustleKE adds 16% VAT on service fees as required by Kenyan tax law. Freelancers are responsible for declaring their own income to KRA. Transaction history from Dashboard > Wallet can serve as your earnings record. We currently do not generate formal invoices, but you can export your transaction history for tax purposes.',
    'multiple_projects': 'There is no limit on how many jobs you can take on simultaneously as a freelancer. However, make sure you can deliver quality work within the agreed timelines for each project. Overcommitting can lead to poor reviews and a lower Hustle Score. As a client, you can also post multiple jobs at once.',
    'work_rejection': 'If the delivered work does not meet the agreed requirements, you can request a revision through the messaging system. If you cannot reach an agreement, open a dispute from Dashboard > Escrow. Our resolution team will review the project requirements, delivered work, and communication to make a fair decision. Escrow funds stay locked until the dispute is resolved.',
    'rules_policies': 'HustleKE has community guidelines to protect all users. Key rules: keep all job communication on the platform until escrow is funded, do not share personal contacts before a contract is in place, deliver work as agreed in the proposal, do not create fake reviews or multiple accounts, and report any suspicious activity. For the full terms, visit our Terms of Service page or contact support at /contact.',
    'password_account': 'To change your password: go to Dashboard > Settings > Security tab. To update your email or phone: go to Dashboard > Settings > Profile tab. If you forgot your password, use the "Forgot Password" link on the login screen — a reset email will be sent to your registered email address.',
    'minimum_bid': 'The minimum bid amount on HustleKE is KES 100. There is no maximum limit — you can bid whatever you believe your work is worth. Clients set their own budget ranges when posting jobs. Keep your bids competitive but fair to your skills and experience level.',
    'multiple_accounts': 'Each user should have only one HustleKE account. Creating multiple accounts to bypass proposal limits or manipulate reviews violates our terms of service and can result in account suspension. If you need to switch between freelancer and client roles, you can do both from the same account.',
    'about_platform': 'HustleKE is Kenya\'s premier freelance marketplace. It connects skilled freelancers with clients who need work done. Key features include: secure M-Pesa escrow payments, identity verification, Hustle Score trust ratings, AI-powered proposal polishing, smart job matching, and plans from Free to Pro (KES 500/month) to Enterprise. Browse jobs at /jobs, find talent at /talent, or sign up free to get started.',
  }

  if (intent) {
    const directAnswer = intentAnswers[intent.intent]
    if (directAnswer) return directAnswer
  }

  // Topic detection patterns — broader fallback
  const topicResponses: Array<{ phrases: string[]; patterns: string[]; response: string }> = [
    {
      phrases: ['bid more than', 'bid higher', 'bid over budget', 'bid amount', 'overbid', 'budget limit', 'bid too'],
      patterns: ['bid', 'budget', 'overbid'],
      response: intentAnswers['bidding_budget']
    },
    {
      phrases: ['share contact', 'share phone', 'share email', 'exchange contact', 'off platform', 'outside platform', 'direct contact', 'personal detail', 'give number', 'whatsapp'],
      patterns: ['share', 'contact', 'phone', 'email', 'whatsapp', 'telegram'],
      response: intentAnswers['contact_sharing']
    },
    {
      phrases: ['get paid', 'receive payment', 'earn money', 'when paid', 'how paid'],
      patterns: ['paid', 'pay', 'payment', 'payout', 'earn', 'money', 'receive', 'income'],
      response: 'On HustleKE, you get paid through M-Pesa escrow. Here is how it works: when a client hires you and accepts your proposal, they fund the escrow. Once you complete the work and the client approves it, payment is released to your M-Pesa wallet instantly — usually within seconds. The platform charges a small service fee (6% on Free, 4% on Pro plan). To withdraw, go to Dashboard > Wallet.'
    },
    {
      phrases: ['service fee', 'how much charge', 'platform fee'],
      patterns: ['fee', 'charge', 'cost', 'price', 'commission', 'deduct', 'percent'],
      response: 'HustleKE charges a service fee on completed transactions: 6% on the Free plan and 4% on the Pro plan (KES 500/month). This is the only platform charge — no hidden fees, no monthly fees on the Free plan. Standard M-Pesa transaction fees from Safaricom may apply on withdrawals. Pro plan pays for itself with just one decent project.'
    },
    {
      phrases: ['escrow work', 'payment protection'],
      patterns: ['escrow'],
      response: 'Escrow is our payment protection system. When a client hires you, they deposit funds into escrow via M-Pesa. The money is held securely — neither party can take it. Once you complete the work and the client approves, funds are released instantly to your wallet. If there is a disagreement, either party can open a dispute and our team resolves it within 48 hours.'
    },
    {
      phrases: ['get started', 'sign up', 'create account', 'first time'],
      patterns: ['start', 'begin', 'join', 'register', 'signup', 'new', 'onboard'],
      response: 'Getting started on HustleKE is easy and free! Sign up with your email and phone number, verify your identity with your national ID (takes ~24 hours), create your profile with skills and portfolio, then start browsing and applying to jobs. You will need an M-Pesa registered number for payments. Our AI will recommend the best opportunities based on your skills.'
    },
    {
      phrases: ['write proposal', 'good proposal', 'apply for job', 'submit proposal'],
      patterns: ['proposal', 'apply', 'bid', 'submit', 'cover letter', 'application'],
      response: 'To apply for a job, click "Apply" on any job listing and write your proposal. Tips for a winning proposal: address the client\'s specific needs, showcase relevant past work, be clear about your timeline, set a competitive bid amount, and use the AI Proposal Polisher to optimize your writing. Free users get 10 proposals/day, Pro gets 20/day.'
    },
    {
      phrases: ['top up', 'add money', 'fund wallet', 'withdraw money'],
      patterns: ['wallet', 'balance', 'topup', 'deposit', 'withdraw', 'mpesa', 'm-pesa', 'transfer'],
      response: 'Your HustleKE wallet stores your earnings and is connected to M-Pesa. To top up: go to Dashboard > Wallet, enter your M-Pesa number and amount, confirm via STK push. To withdraw: enter the amount and it goes straight to your M-Pesa. Wallet also handles subscription payments and escrow transactions.'
    },
    {
      phrases: ['pro plan', 'upgrade pro', 'pro worth', 'pro benefit'],
      patterns: ['pro', 'premium', 'upgrade', 'subscription', 'plan', 'subscribe', 'membership'],
      response: 'The Pro plan costs KES 500/month and gives you: lower 4% service fee (vs 6%), 20 proposals/day (vs 10), priority in job matching, advanced analytics on your dashboard, a PRO badge on your profile, and priority support. Cancel anytime — no lock-in. Try promo code EARLYBIRD for a free first month! Upgrade from Dashboard > Settings > Subscription.'
    },
    {
      phrases: ['open dispute', 'file dispute', 'report problem'],
      patterns: ['dispute', 'problem', 'issue', 'complaint', 'refund', 'conflict', 'scam', 'fraud', 'legit', 'legitimate', 'trustworthy', 'reliable', 'fake'],
      response: 'HustleKE is a legitimate, secure freelance marketplace. We protect all payments through M-Pesa escrow — funds are held safely until work is approved. All users go through identity verification. If there is a dispute, our resolution team reviews evidence within 48 hours. We use bank-level encryption and Row Level Security. If you have a specific issue, open a dispute from Dashboard > Escrow or contact support at /contact.'
    },
    {
      phrases: ['verify account', 'verify identity', 'id verification'],
      patterns: ['verify', 'verification', 'identity', 'validated'],
      response: 'Account verification requires a valid national ID or passport and phone number verification. Most verifications complete within 24 hours. Once verified, you get a verified badge, higher Hustle Score, and access to more jobs. Your Hustle Score (0-100) is based on completed jobs, reviews, response time, and platform activity.'
    },
    {
      phrases: ['update profile', 'edit profile', 'change profile'],
      patterns: ['profile', 'portfolio', 'photo', 'avatar', 'bio', 'skills', 'experience', 'education'],
      response: 'You can customize your profile from Dashboard > Settings. Add your professional bio, skills, hourly rate, education, and certifications. Upload a profile photo (JPEG/PNG/WebP, under 2MB). In the Portfolio tab, create project categories and showcase your work with up to 10 images per project. A complete profile helps you win more jobs.'
    },
    {
      phrases: ['find job', 'browse job', 'post job', 'hire freelancer'],
      patterns: ['job', 'project', 'gig', 'task', 'find', 'browse', 'search', 'hire', 'post'],
      response: 'As a freelancer, browse available jobs at /jobs — filter by category, budget, and skills. As a client, post your project with requirements and budget, then review proposals from qualified freelancers. You can message candidates, compare profiles, and hire the best fit. Fund the escrow and the project begins!'
    },
    {
      phrases: ['send message', 'contact support', 'reach out'],
      patterns: ['message', 'chat', 'communicate', 'talk', 'support', 'help', 'reach'],
      response: 'You can message any freelancer or client you are working with through Dashboard > Messages. Conversations are organized by job. For platform support, visit /contact or email support@hustleke.com. Pro users get priority support. Our team typically responds within 24 hours.'
    },
    {
      phrases: ['cancel subscription', 'stop subscription', 'delete account'],
      patterns: ['cancel', 'unsubscribe', 'stop', 'terminate', 'close', 'deactivate'],
      response: 'To cancel your Pro subscription, go to Dashboard > Settings > Subscription and click Cancel. You keep all Pro benefits until your current billing period ends. To delete your account entirely, contact support — you must complete all active contracts and withdraw all funds first.'
    },
    {
      phrases: ['enterprise plan', 'team plan', 'business plan'],
      patterns: ['enterprise', 'team', 'company', 'business', 'corporate', 'bulk', 'organization'],
      response: 'Enterprise plan is for businesses and teams. It includes: custom fee rates from 3%, unlimited proposals, team management and bulk hiring, API access, a dedicated account manager, and 2-hour support SLAs. Contact us at /enterprise or /contact to set up your Enterprise account.'
    },
    {
      phrases: ['about hustleke', 'what is hustleke', 'tell me about'],
      patterns: ['hustleke', 'platform', 'website', 'site', 'about', 'overview'],
      response: 'HustleKE is Kenya\'s premier freelance marketplace. It connects skilled freelancers with clients who need work done. Key features include: secure M-Pesa escrow payments, identity verification, Hustle Score trust ratings, AI-powered proposal polishing, smart job matching, and plans from Free to Pro (KES 500/month) to Enterprise. Browse jobs at /jobs, find talent at /talent, or sign up free to get started.'
    },
    {
      phrases: ['leave review', 'give feedback', 'star rating'],
      patterns: ['review', 'feedback', 'rating', 'star', 'testimonial', 'reputation'],
      response: 'After completing a job, both freelancers and clients can leave reviews with star ratings (1-5) and sub-ratings for communication, quality, and timeliness. Reviews are public and contribute to your Hustle Score. Higher-rated freelancers get priority in search results. You can view reviews on any user\'s profile page.'
    },
    {
      phrases: ['how long', 'how fast', 'how quick', 'time take'],
      patterns: ['time', 'long', 'duration', 'deadline', 'fast', 'quick', 'slow', 'speed', 'turnaround'],
      response: 'Timelines depend on the project scope agreed between client and freelancer. Escrow payments are released instantly once the client approves the work. Account verification takes about 24 hours. Pro subscription activates immediately. Our support team responds within 24 hours. M-Pesa transactions process in seconds.'
    },
    {
      phrases: ['allowed', 'can i', 'am i allowed', 'is it okay', 'permitted', 'rules', 'policy', 'terms'],
      patterns: ['allowed', 'permitted', 'rules', 'policy', 'terms', 'guidelines', 'forbidden', 'prohibited', 'banned'],
      response: 'HustleKE has community guidelines to protect all users. Key rules: keep all job communication on the platform until escrow is funded, do not share personal contacts before a contract is in place, deliver work as agreed in the proposal, do not create fake reviews or multiple accounts, and report any suspicious activity. For the full terms, visit our Terms of Service page or contact support at /contact.'
    },
    {
      phrases: ['multiple account', 'two account', 'second account'],
      patterns: ['multiple', 'accounts', 'duplicate', 'second'],
      response: 'Each user should have only one HustleKE account. Creating multiple accounts to bypass proposal limits or manipulate reviews violates our terms of service and can result in account suspension. If you need to switch between freelancer and client roles, you can do both from the same account — your dashboard adapts to your role automatically.'
    },
    {
      phrases: ['change email', 'change phone', 'change password', 'update email', 'update phone', 'update password', 'forgot password', 'reset password'],
      patterns: ['password', 'email', 'phone', 'reset', 'forgot', 'change'],
      response: 'To change your password: go to Dashboard > Settings > Security tab. To update your email or phone: go to Dashboard > Settings > Profile tab. If you forgot your password, use the "Forgot Password" link on the login screen — a reset email will be sent to your registered email address.'
    },
    {
      phrases: ['how many jobs', 'job limit', 'simultaneous', 'at once', 'same time', 'multiple jobs'],
      patterns: ['many', 'limit', 'simultaneous', 'multiple', 'several'],
      response: 'There is no limit on how many jobs you can take on simultaneously as a freelancer. However, make sure you can deliver quality work within the agreed timelines for each project. Overcommitting can lead to poor reviews and a lower Hustle Score. As a client, you can also post multiple jobs at once.'
    },
    {
      phrases: ['incomplete work', 'not finished', 'bad quality', 'poor work', 'not satisfied', 'client reject', 'revision', 'redo'],
      patterns: ['incomplete', 'finished', 'quality', 'poor', 'satisfied', 'reject', 'revision', 'redo', 'rework'],
      response: 'If the delivered work does not meet the agreed requirements, you can request a revision through the messaging system. If you cannot reach an agreement, open a dispute from Dashboard > Escrow. Our resolution team will review the project requirements, delivered work, and communication to make a fair decision. Escrow funds stay locked until the dispute is resolved.'
    },
    {
      phrases: ['tax', 'vat', 'invoice', 'receipt', 'kra'],
      patterns: ['tax', 'vat', 'invoice', 'receipt', 'kra', 'taxation'],
      response: 'HustleKE adds 16% VAT on service fees as required by Kenyan tax law. Freelancers are responsible for declaring their own income to KRA. Transaction history from Dashboard > Wallet can serve as your earnings record. We currently do not generate formal invoices, but you can export your transaction history for tax purposes.'
    },
    {
      phrases: ['minimum bid', 'minimum amount', 'minimum budget', 'lowest bid', 'minimum project'],
      patterns: ['minimum', 'lowest', 'smallest'],
      response: 'The minimum bid amount on HustleKE is KES 100. There is no maximum limit — you can bid whatever you believe your work is worth. Clients set their own budget ranges when posting jobs. Keep your bids competitive but fair to your skills and experience level.'
    },
  ]

  // Score each topic response — phrase matches weighted much higher than single words
  let bestResponse = ''
  let bestTopicScore = 0

  for (const topic of topicResponses) {
    let topicScore = 0
    // Phrase matches (high priority — these indicate clear intent)
    for (const phrase of topic.phrases) {
      if (lower.includes(phrase)) {
        topicScore += 10
      }
    }
    // Single word pattern matches (lower priority)
    for (const pattern of topic.patterns) {
      if (lower.includes(pattern)) topicScore += 2
      // Only exact synonym match, not substring
      for (const w of words) {
        if (expandWithSynonyms(w).includes(pattern)) {
          topicScore += 1
        }
      }
    }
    if (topicScore > bestTopicScore) {
      bestTopicScore = topicScore
      bestResponse = topic.response
    }
  }

  if (bestResponse && bestTopicScore >= 2) return bestResponse

  // Absolute fallback — always give a useful response
  return `Thanks for your question! While I don't have a specific pre-written answer for "${question}", here is what might help: HustleKE is Kenya's freelance marketplace where you can find work, hire talent, and get paid securely through M-Pesa escrow. For detailed help, visit Dashboard > Settings or contact our support team at /contact — they typically respond within 24 hours. You can also browse our FAQ categories above for answers to common questions about payments, fees, proposals, and more.`
}

// Rewrite an agent's answer in clear, friendly tone
function rewriteAnswer(originalAnswer: string, question: string): string {
  // Find a matching FAQ answer
  const match = matchQuestion(question)
  if (match) {
    return match.answer
  }

  // Try generating a contextual answer from the question
  const generated = generateAnswer(question)
  if (generated && !generated.startsWith('Thanks for your question! While I don')) {
    return generated
  }

  // If no FAQ match, clean up the original answer
  let cleaned = originalAnswer.trim()
  // Remove overly formal prefixes
  cleaned = cleaned.replace(/^(Dear (Sir|Madam|Customer|User),?\s*)/i, '')
  cleaned = cleaned.replace(/^(Hello,?\s*)/i, '')
  cleaned = cleaned.replace(/^(Hi there,?\s*)/i, '')
  // Remove trailing formalities
  cleaned = cleaned.replace(/\s*(Best regards|Kind regards|Regards|Sincerely|Yours truly|Thank you for contacting us)[,.]?\s*(The HustleKE Team)?\.?\s*$/i, '')
  // Ensure it ends with a period
  if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.'
  }

  return cleaned || originalAnswer
}

// GET /api/faq/intelligence — detect questions, suggest answers, generate live replies
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'trending'

  if (action === 'trending') {
    // Fetch recent messages that look like questions (public, no auth needed)
    const pubResult = createPublicRouteClient(req)
    if (pubResult.error) return pubResult.error
    const supabase = pubResult.supabase

    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, created_at')
      .like('content', '%?%')
      .order('created_at', { ascending: false })
      .limit(200)

    // Extract unique questions and match to FAQs
    const detectedQuestions: Array<{ question: string; suggestedAnswer: string; category: string; confidence: 'high' | 'medium' | 'low'; detectedAt: string }> = []
    const seenFaqIds = new Set<string>()

    if (recentMessages) {
      for (const msg of recentMessages) {
        // Extract question sentences
        const sentences = msg.content.split(/(?<=[?])\s*/)
        for (const sentence of sentences) {
          if (!sentence.includes('?')) continue
          const cleaned = sentence.trim()
          if (cleaned.length < 10 || cleaned.length > 300) continue

          const match = matchQuestion(cleaned)
          if (match && !seenFaqIds.has(match.id)) {
            seenFaqIds.add(match.id)
            detectedQuestions.push({
              question: match.question,
              suggestedAnswer: match.answer,
              category: match.category,
              confidence: 'high',
              detectedAt: msg.created_at,
            })
          }
        }
      }
    }

    // Fill with popular FAQs if not enough detected
    if (detectedQuestions.length < 5) {
      const popularIds = ['fee-1', 'pay-1', 'pay-2', 'plan-1', 'acc-3', 'job-1', 'safe-1']
      for (const id of popularIds) {
        if (seenFaqIds.has(id)) continue
        const faq = FAQ_KNOWLEDGE_BASE.find(f => f.id === id)
        if (faq && detectedQuestions.length < 8) {
          detectedQuestions.push({
            question: faq.question,
            suggestedAnswer: faq.answer,
            category: faq.category,
            confidence: 'medium',
            detectedAt: new Date().toISOString(),
          })
          seenFaqIds.add(id)
        }
      }
    }

    return jsonResponse({
      trending: detectedQuestions,
      totalKnowledgeBase: FAQ_KNOWLEDGE_BASE.length,
      lastScan: new Date().toISOString(),
    })
  }

  if (action === 'search') {
    const query = url.searchParams.get('q') || ''
    if (!query || query.length < 2) {
      return jsonResponse({ results: [], query })
    }

    // Use the robust scoring engine
    const results = matchQuestionMultiple(query, 5)
      .map(({ keywords, score, ...rest }) => ({ ...rest, relevance: score }))

    return jsonResponse({ results, query })
  }

  // ASK — always returns an answer, never empty
  if (action === 'ask') {
    let query = url.searchParams.get('q') || ''
    const originalQuery = url.searchParams.get('original_q') || query
    
    if (!query || query.length < 2) {
      return jsonResponse({
        answer: 'Please type a question and I will do my best to help you!',
        source: 'system',
        relatedFaqs: [],
        query: originalQuery,
      })
    }

    // Extract just the current question if context was provided
    if (query.includes('Current question:')) {
      const parts = query.split('Current question:')
      query = parts[parts.length - 1].trim()
    }

    // Step 0: Check for intent FIRST — if detected, generateAnswer has a precise response
    const queryIntent = detectIntent(query)
    if (queryIntent) {
      const generated = generateAnswer(query)
      const isFallback = generated.startsWith('Thanks for your question! While I don')

      if (!isFallback) {
        // Intent detected and we have a direct answer — use it
        const related = matchQuestionMultiple(query, 3)
          .map(({ keywords, score, ...rest }) => rest)

        // If intent also has a matching FAQ, include it as context
        let matchedQuestion: string | undefined
        let category: string | undefined
        if (queryIntent.faqIds.length > 0) {
          const faq = FAQ_KNOWLEDGE_BASE.find(f => f.id === queryIntent.faqIds[0])
          if (faq) {
            matchedQuestion = faq.question
            category = faq.category
          }
        }

        return jsonResponse({
          answer: generated,
          matchedQuestion,
          category,
          source: 'ai_generated',
          confidence: 'high',
          relatedFaqs: related,
          query: originalQuery,
        })
      }
    }

    // Step 1: Try KB match (only if no intent was detected or intent had no answer)
    const bestMatch = matchQuestion(query)
    if (bestMatch) {
      const related = matchQuestionMultiple(query, 4)
        .filter(f => f.id !== bestMatch.id)
        .map(({ keywords, score, ...rest }) => rest)

      return jsonResponse({
        answer: bestMatch.answer,
        matchedQuestion: bestMatch.question,
        category: bestMatch.category,
        source: 'knowledge_base',
        confidence: 'high',
        relatedFaqs: related,
        query: originalQuery,
      })
    }

    // Step 2: Try ranked KB matches with reasonable score
    const queryWords = extractKeywords(query)
    const minRankedScore = Math.max(3, queryWords.length * 1.5)
    const ranked = matchQuestionMultiple(query, 3)
    if (ranked.length > 0 && ranked[0].score >= minRankedScore) {
      const top = ranked[0]
      const related = ranked.slice(1).map(({ keywords, score, ...rest }) => rest)

      return jsonResponse({
        answer: top.answer,
        matchedQuestion: top.question,
        category: top.category,
        source: 'knowledge_base',
        confidence: top.score >= minRankedScore * 1.5 ? 'high' : 'medium',
        relatedFaqs: related,
        query: originalQuery,
      })
    }

    // Step 3: Generate a contextual answer (topic patterns + fallback)
    const generated = generateAnswer(query)
    const relatedFromGenerated = matchQuestionMultiple(query, 3)
      .map(({ keywords, score, ...rest }) => rest)

    return jsonResponse({
      answer: generated,
      source: 'ai_generated',
      confidence: generated.startsWith('Thanks for your question! While I don') ? 'low' : 'high',
      relatedFaqs: relatedFromGenerated,
      query: originalQuery,
    })
  }

  if (action === 'rewrite') {
    const question = url.searchParams.get('question') || ''
    const answer = url.searchParams.get('answer') || ''
    if (!question && !answer) {
      return errorResponse('Provide question and/or answer params', 400)
    }
    const rewritten = rewriteAnswer(answer, question)
    return jsonResponse({ original: answer, rewritten, question })
  }

  return jsonResponse({ actions: ['trending', 'search', 'rewrite', 'ask'] })
}
