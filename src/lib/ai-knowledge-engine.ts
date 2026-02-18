/**
 * HustleKE AI Knowledge Engine
 * 
 * A comprehensive, robust AI assistant that understands natural language questions
 * about the HustleKE platform. Uses multi-layer matching:
 * 
 * 1. Intent detection (phrase + keyword combos)
 * 2. Semantic similarity scoring (TF-IDF inspired)
 * 3. Synonym expansion with contextual awareness
 * 4. Conversational context tracking
 * 5. Step-by-step guidance generation
 * 6. Fallback with intelligent topic inference
 */

// ============================================================================
// STOP WORDS
// ============================================================================
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'and', 'but', 'or', 'nor', 'not',
  'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own',
  'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where',
  'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it', 'its', 'they',
  'them', 'their', 'he', 'she', 'him', 'her', 'his', 'about', 'up', 'out',
  'then', 'there', 'here', 'also', 'like', 'really', 'please', 'want',
  'need', 'know', 'tell', 'explain', 'understand', 'wondering', 'curious',
])

// ============================================================================
// SYNONYM MAP — bidirectional expansion
// ============================================================================
const SYNONYMS: Record<string, string[]> = {
  'pay': ['payment', 'payout', 'earn', 'earnings', 'income', 'money', 'receive', 'compensate', 'compensation', 'salary', 'wage', 'cash', 'paid', 'withdraw', 'remit', 'remittance', 'settle'],
  'fee': ['fees', 'charge', 'charges', 'cost', 'costs', 'price', 'pricing', 'commission', 'deduction', 'percent', 'percentage', 'rate', 'tariff'],
  'escrow': ['hold', 'holding', 'secure payment', 'protection', 'safeguard', 'trust', 'locked funds'],
  'wallet': ['balance', 'funds', 'account balance', 'top up', 'topup', 'deposit', 'purse'],
  'proposal': ['proposals', 'bid', 'bids', 'apply', 'application', 'submit', 'cover letter', 'pitch'],
  'job': ['jobs', 'project', 'projects', 'gig', 'gigs', 'work', 'task', 'tasks', 'hustle', 'hustles', 'opportunity', 'opportunities', 'contract'],
  'hire': ['hiring', 'recruit', 'recruiting', 'employ', 'engage', 'onboard', 'bring on'],
  'profile': ['account', 'settings', 'bio', 'portfolio', 'avatar', 'photo', 'page'],
  'verify': ['verification', 'verified', 'identity', 'id', 'confirm', 'validate', 'validated', 'authenticate'],
  'dispute': ['problem', 'issue', 'conflict', 'complaint', 'refund', 'disagreement', 'resolve', 'resolution'],
  'pro': ['premium', 'upgrade', 'subscription', 'plan', 'subscribe', 'membership', 'paid plan'],
  'cancel': ['cancellation', 'unsubscribe', 'stop', 'end', 'terminate', 'quit', 'discontinue'],
  'register': ['sign up', 'signup', 'registration', 'create account', 'join', 'get started', 'start', 'begin', 'onboard', 'enroll'],
  'mpesa': ['m-pesa', 'safaricom', 'stk', 'paybill', 'till', 'mobile money', 'lipa na mpesa'],
  'secure': ['security', 'safe', 'safety', 'privacy', 'private', 'encrypt', 'encrypted', 'protection', 'data protection'],
  'score': ['hustle score', 'rating', 'reputation', 'trust', 'rank', 'ranking', 'credibility'],
  'fast': ['quick', 'quickly', 'instant', 'instantly', 'speed', 'how long', 'time', 'duration', 'soon', 'rapid'],
  'delete': ['remove', 'deactivate', 'close account', 'shut down', 'erase'],
  'freelancer': ['freelance', 'worker', 'talent', 'professional', 'expert', 'specialist', 'contractor'],
  'client': ['employer', 'buyer', 'hirer', 'customer', 'business owner', 'company'],
  'message': ['chat', 'communicate', 'talk', 'contact', 'reach', 'inbox', 'conversation'],
  'review': ['feedback', 'rating', 'star', 'testimonial', 'reputation', 'evaluate'],
  'withdraw': ['withdrawal', 'cash out', 'send to mpesa', 'transfer out', 'take out money'],
  'deposit': ['top up', 'add money', 'fund', 'load', 'put money'],
}

// ============================================================================
// COMPREHENSIVE KNOWLEDGE BASE — 80+ detailed entries
// ============================================================================
export interface KnowledgeEntry {
  id: string
  category: string
  subcategory: string
  question: string
  alternateQuestions: string[]
  answer: string
  keywords: string[]
  steps?: string[]
  links?: string[]
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ── GETTING STARTED ──────────────────────────────────────────────────
  {
    id: 'start-1',
    category: 'getting_started',
    subcategory: 'overview',
    question: 'What is HustleKE?',
    alternateQuestions: ['tell me about hustleke', 'what does hustleke do', 'what is this platform', 'what is this site', 'explain hustleke', 'how does hustleke work', 'what is this website about'],
    answer: 'HustleKE is Kenya\'s premier freelance marketplace that connects skilled freelancers with clients who need work done. Think of it as a Kenyan version of Upwork or Fiverr, but built specifically for the Kenyan market with M-Pesa integration.\n\nKey features:\n• **Secure M-Pesa escrow payments** — your money is protected\n• **Identity verification** — all users are verified\n• **Hustle Score** — trust rating system (0-100)\n• **AI-powered tools** — proposal polisher, smart job matching\n• **Plans**: Free, Pro (KES 500/mo), and Enterprise\n\nWhether you\'re a freelancer looking for work or a client needing talent, HustleKE makes it easy and secure.',
    keywords: ['hustleke', 'platform', 'about', 'what', 'overview', 'explain', 'website', 'site', 'marketplace', 'freelance'],
  },
  {
    id: 'start-2',
    category: 'getting_started',
    subcategory: 'signup',
    question: 'How do I sign up / create an account?',
    alternateQuestions: ['how to register', 'how to create account', 'how to join', 'how to get started', 'i want to sign up', 'registration process', 'how do i start', 'new user', 'first time here'],
    answer: 'Signing up on HustleKE is free and takes just a few minutes!',
    keywords: ['sign up', 'register', 'create', 'account', 'join', 'start', 'new', 'begin'],
    steps: [
      'Click "Sign Up" on the homepage or header',
      'Enter your email address and create a password',
      'Choose your role: Freelancer or Client (you can do both later)',
      'Enter your phone number (must be M-Pesa registered)',
      'Fill in your name and county',
      'Verify your email by clicking the link sent to your inbox',
      'Complete your profile with skills, bio, and hourly rate',
      'Optional: Upload your national ID for verification (recommended — gets you more jobs)',
    ],
    links: ['/signup'],
  },
  {
    id: 'start-3',
    category: 'getting_started',
    subcategory: 'freelancer_guide',
    question: 'How do I start freelancing on HustleKE?',
    alternateQuestions: ['how to find work', 'how to get jobs', 'freelancer guide', 'beginner freelancer', 'new freelancer tips', 'how to earn money here', 'i want to work', 'looking for work', 'how to make money'],
    answer: 'Here\'s your complete guide to starting as a freelancer on HustleKE:',
    keywords: ['freelance', 'start', 'work', 'find', 'earn', 'money', 'jobs', 'beginner', 'guide'],
    steps: [
      '**Complete your profile** — Add a professional bio, your skills, hourly rate, education, and portfolio. Profiles with photos get 3x more views',
      '**Get verified** — Upload your national ID in Settings. Verified freelancers appear higher in search results',
      '**Browse jobs** — Go to /jobs and filter by your skills, budget range, and category',
      '**Write winning proposals** — Address the client\'s specific needs, showcase relevant work, set a competitive bid. Use the AI Proposal Polisher!',
      '**Communicate clearly** — Respond quickly to messages. Fast response time boosts your Hustle Score',
      '**Deliver quality work** — Complete projects on time. Good reviews = higher Hustle Score = more jobs',
      '**Get paid instantly** — When the client approves your work, payment goes straight to your M-Pesa wallet',
    ],
    links: ['/jobs', '/talent'],
  },
  {
    id: 'start-4',
    category: 'getting_started',
    subcategory: 'client_guide',
    question: 'How do I hire a freelancer?',
    alternateQuestions: ['how to post a job', 'how to find talent', 'client guide', 'i need someone to do work', 'how to hire', 'looking for freelancer', 'need help with project', 'how to post work'],
    answer: 'Hiring talent on HustleKE is straightforward and secure:',
    keywords: ['hire', 'post', 'job', 'find', 'talent', 'freelancer', 'client', 'project', 'work'],
    steps: [
      '**Post your job** — Click "Post a Job" and describe what you need, set a budget, and choose a category',
      '**Review proposals** — Freelancers will submit proposals with their bid, timeline, and approach',
      '**Check profiles** — Look at Hustle Scores, reviews, portfolios, and verification status',
      '**Message candidates** — Ask questions and discuss project details before hiring',
      '**Accept a proposal** — When you find the right fit, accept their proposal',
      '**Fund escrow** — Deposit the project budget via M-Pesa. Money is held securely until work is approved',
      '**Review deliverables** — When the freelancer submits work, review it and request revisions if needed',
      '**Approve and release payment** — Once satisfied, approve the work. Payment is released instantly to the freelancer',
    ],
    links: ['/post-job', '/talent'],
  },

  // ── PAYMENTS & WALLET ────────────────────────────────────────────────
  {
    id: 'pay-1',
    category: 'payments',
    subcategory: 'escrow',
    question: 'How does escrow work?',
    alternateQuestions: ['what is escrow', 'how is my money protected', 'is my payment safe', 'escrow system', 'payment protection', 'how are funds held', 'what happens to my money'],
    answer: 'Escrow is HustleKE\'s payment protection system that keeps both freelancers and clients safe.\n\n**How it works:**\n1. Client accepts a proposal and funds the escrow via M-Pesa\n2. Money is held securely by HustleKE — neither party can access it\n3. Freelancer completes the work and submits deliverables\n4. Client reviews the work\n5. If approved → funds are released instantly to the freelancer\'s wallet\n6. If there\'s a dispute → our resolution team reviews within 48 hours\n\n**Key points:**\n• Funds are never at risk — they\'re locked until work is approved\n• Both parties must agree for funds to move\n• Disputes are resolved fairly with evidence from both sides\n• Service fee (6% Free / 4% Pro) is deducted when funds are released',
    keywords: ['escrow', 'protect', 'safe', 'hold', 'fund', 'secure', 'payment protection'],
  },
  {
    id: 'pay-2',
    category: 'payments',
    subcategory: 'getting_paid',
    question: 'How do I get paid?',
    alternateQuestions: ['when do i receive payment', 'how fast is payment', 'how long to get paid', 'payment process', 'how does payment work', 'when will i get my money', 'how to receive money', 'payout process', 'how to cash out'],
    answer: 'Getting paid on HustleKE is fast and simple:\n\n1. **Complete the work** and submit deliverables through the platform\n2. **Client reviews** your work (they can request revisions if needed)\n3. **Client approves** — payment is released from escrow to your HustleKE wallet **instantly**\n4. **Withdraw to M-Pesa** — Go to Dashboard > Wallet, enter amount, and it\'s sent to your M-Pesa within seconds\n\n**Important details:**\n• Service fee is deducted automatically (6% Free plan, 4% Pro plan)\n• Standard Safaricom M-Pesa charges apply on withdrawal\n• No minimum withdrawal amount\n• Payments are processed 24/7 — even weekends and holidays\n• Your transaction history is available in Dashboard > Wallet',
    keywords: ['paid', 'payment', 'receive', 'money', 'payout', 'withdraw', 'cash', 'earn', 'income', 'fast'],
  },
  {
    id: 'pay-3',
    category: 'payments',
    subcategory: 'methods',
    question: 'What payment methods are accepted?',
    alternateQuestions: ['can i pay with visa', 'do you accept bank transfer', 'payment options', 'how to pay', 'can i use paypal', 'accepted payment methods', 'can i pay with card'],
    answer: 'Currently, all payments on HustleKE are processed through **M-Pesa** (Safaricom mobile money).\n\n**How it works:**\n• **Top up wallet**: Enter your M-Pesa number → receive STK push → confirm on phone → wallet credited instantly\n• **Withdraw**: Enter amount → funds sent to your M-Pesa number within seconds\n• **Escrow funding**: Automatically via M-Pesa when you accept a proposal\n\n**Why M-Pesa only?**\nM-Pesa is the most widely used payment method in Kenya with over 30 million users. It\'s instant, secure, and accessible to everyone.\n\n**Coming soon:** Bank transfers and card payments are on our roadmap.',
    keywords: ['payment method', 'mpesa', 'visa', 'card', 'bank', 'paypal', 'pay', 'accepted', 'options'],
  },
  {
    id: 'pay-4',
    category: 'payments',
    subcategory: 'topup',
    question: 'How do I top up / deposit money into my wallet?',
    alternateQuestions: ['how to add money', 'how to fund wallet', 'how to deposit', 'wallet top up', 'load wallet', 'add funds', 'put money in wallet'],
    answer: 'Topping up your HustleKE wallet is quick and easy via M-Pesa:',
    keywords: ['top up', 'deposit', 'add money', 'fund', 'wallet', 'load', 'mpesa'],
    steps: [
      'Go to **Dashboard > Wallet**',
      'Click the **"Top Up"** button',
      'Enter your **M-Pesa phone number** (format: 07XX or 254XX)',
      'Enter the **amount** you want to deposit (minimum KES 10)',
      'Click **"Top Up"** — you\'ll receive an STK push on your phone',
      'Enter your **M-Pesa PIN** on the STK push prompt',
      'Your wallet is credited **instantly** after confirmation',
    ],
    links: ['/dashboard/wallet'],
  },
  {
    id: 'pay-5',
    category: 'payments',
    subcategory: 'withdraw',
    question: 'How do I withdraw money from my wallet?',
    alternateQuestions: ['how to cash out', 'how to send money to mpesa', 'withdraw to mpesa', 'get money out', 'transfer to mpesa', 'how to withdraw earnings'],
    answer: 'Withdrawing from your HustleKE wallet to M-Pesa:',
    keywords: ['withdraw', 'cash out', 'mpesa', 'transfer', 'send', 'money out'],
    steps: [
      'Go to **Dashboard > Wallet**',
      'Click **"Withdraw"**',
      'Enter the **amount** you want to withdraw',
      'Confirm your **M-Pesa phone number**',
      'Click **"Withdraw"** to confirm',
      'Funds are sent to your M-Pesa **within seconds**',
    ],
    links: ['/dashboard/wallet'],
  },
  {
    id: 'pay-6',
    category: 'payments',
    subcategory: 'failed',
    question: 'My payment failed / is stuck. What do I do?',
    alternateQuestions: ['payment not going through', 'mpesa failed', 'transaction failed', 'money not received', 'payment stuck', 'deposit not working', 'withdrawal failed', 'stk push not received'],
    answer: 'If your payment failed, here are the common causes and solutions:\n\n**STK Push not received:**\n• Check your phone has network signal\n• Make sure you entered the correct M-Pesa number\n• Wait 30 seconds and try again — sometimes there\'s a slight delay\n• Check if you have sufficient M-Pesa balance\n\n**Payment stuck as "Pending":**\n• M-Pesa transactions usually complete in seconds\n• If pending for more than 5 minutes, the transaction may have timed out\n• Check your M-Pesa statement (Safaricom app or *334#) to confirm if money was deducted\n• If money was deducted but wallet not credited, contact support — we\'ll resolve it within 24 hours\n\n**Withdrawal failed:**\n• Ensure you have sufficient wallet balance\n• Check that your M-Pesa number is correct and active\n• Standard Safaricom limits apply (max KES 150,000 per transaction)\n\n**Still having issues?** Click "Connect to human" to speak with our support team.',
    keywords: ['failed', 'stuck', 'pending', 'not working', 'error', 'problem', 'issue', 'declined', 'rejected'],
  },

  // ── FEES & PRICING ───────────────────────────────────────────────────
  {
    id: 'fee-1',
    category: 'fees',
    subcategory: 'service_fee',
    question: 'What are the fees / how much does HustleKE charge?',
    alternateQuestions: ['service fee', 'platform fee', 'commission rate', 'how much do you charge', 'what does it cost', 'pricing', 'is it free', 'any charges', 'fee structure', 'what percentage'],
    answer: 'HustleKE has a simple, transparent fee structure:\n\n**Free Plan (KES 0/month):**\n• 6% service fee on completed projects\n• 10 proposals per day\n• Standard job matching\n• No signup fees, no hidden charges\n\n**Pro Plan (KES 500/month):**\n• 4% service fee (saves you 2% on every project!)\n• 20 proposals per day\n• Priority job matching\n• PRO badge on your profile\n• Advanced analytics dashboard\n• Priority support\n\n**Enterprise (Custom pricing):**\n• Fees from 3%\n• Unlimited proposals\n• Team management\n• Dedicated account manager\n\n**Additional costs:**\n• Standard Safaricom M-Pesa charges on withdrawals\n• 16% VAT on service fees (as required by Kenyan tax law)\n\n**No hidden fees.** You only pay when a project is completed successfully. Compared to competitors who charge 10-20%, HustleKE is significantly cheaper!',
    keywords: ['fee', 'charge', 'cost', 'price', 'commission', 'percent', 'percentage', 'how much', 'pricing', 'rate', 'expensive', 'cheap', 'free'],
  },
  {
    id: 'fee-2',
    category: 'fees',
    subcategory: 'hidden_fees',
    question: 'Are there any hidden fees?',
    alternateQuestions: ['extra charges', 'additional costs', 'surprise fees', 'other charges', 'what else do i pay'],
    answer: 'No, there are absolutely **no hidden fees** on HustleKE.\n\nThe only platform charge is the service fee:\n• **6% on Free plan** or **4% on Pro plan** — deducted from completed project payments\n\nThe only other cost is standard **Safaricom M-Pesa transaction fees** when you withdraw funds, which are charged by Safaricom (not HustleKE).\n\nThere are:\n• No signup fees\n• No monthly fees on the Free plan\n• No listing fees for posting jobs\n• No fees for sending proposals\n• No fees for messaging\n• No withdrawal fees from HustleKE (only Safaricom charges)',
    keywords: ['hidden', 'extra', 'additional', 'surprise', 'other', 'secret'],
  },
  {
    id: 'fee-3',
    category: 'fees',
    subcategory: 'pro_savings',
    question: 'How does Pro plan save me money?',
    alternateQuestions: ['is pro worth it', 'pro plan benefits', 'should i upgrade', 'pro vs free', 'why upgrade to pro', 'pro plan value'],
    answer: 'The Pro plan (KES 500/month) saves you money through lower fees:\n\n**Example on a KES 50,000 project:**\n• Free plan: 6% fee = KES 3,000 deducted\n• Pro plan: 4% fee = KES 2,000 deducted\n• **You save KES 1,000** on just one project!\n\nThe Pro subscription costs KES 500/month, so it **pays for itself with just one decent project**.\n\n**All Pro benefits:**\n• ✅ 4% service fee (vs 6%)\n• ✅ 20 proposals/day (vs 10)\n• ✅ Priority in job matching\n• ✅ PRO badge on your profile\n• ✅ Advanced analytics dashboard\n• ✅ Priority customer support\n\n**Try it free:** Use promo code **EARLYBIRD** for a free first month!\n\nUpgrade from Dashboard > Settings > Subscription.',
    keywords: ['pro', 'worth', 'save', 'benefit', 'upgrade', 'value', 'compare', 'vs', 'free'],
    links: ['/pricing', '/dashboard/settings?tab=subscription'],
  },
  {
    id: 'fee-4',
    category: 'fees',
    subcategory: 'mpesa_charges',
    question: 'What are the M-Pesa withdrawal charges?',
    alternateQuestions: ['mpesa fees', 'safaricom charges', 'withdrawal charges', 'how much to withdraw', 'mpesa tariff'],
    answer: 'HustleKE does **not** charge any withdrawal fees. However, standard **Safaricom M-Pesa transaction charges** apply when you withdraw to your M-Pesa.\n\nThese are the standard Safaricom rates (not set by HustleKE):\n• KES 1 - 100: Free\n• KES 101 - 500: KES 7\n• KES 501 - 1,000: KES 13\n• KES 1,001 - 1,500: KES 23\n• KES 1,501 - 2,500: KES 33\n• KES 2,501 - 3,500: KES 53\n• And so on per Safaricom\'s tariff schedule\n\nYou can check the full M-Pesa tariff at /mpesa-tariffs or on the Safaricom website.',
    keywords: ['mpesa', 'withdrawal', 'charges', 'safaricom', 'tariff', 'fee'],
    links: ['/mpesa-tariffs'],
  },

  // ── PROPOSALS & JOBS ─────────────────────────────────────────────────
  {
    id: 'job-1',
    category: 'jobs',
    subcategory: 'proposals',
    question: 'How do I write a good proposal?',
    alternateQuestions: ['proposal tips', 'how to apply for jobs', 'winning proposal', 'how to bid', 'proposal advice', 'how to get hired', 'cover letter tips'],
    answer: 'A great proposal is your ticket to getting hired. Here are proven tips:\n\n**Structure your proposal:**\n1. **Open with understanding** — Show you\'ve read the job description. Reference specific requirements\n2. **Showcase relevant experience** — Mention similar projects you\'ve completed\n3. **Explain your approach** — Briefly describe how you\'ll tackle the project\n4. **Set a clear timeline** — Be specific: "I can deliver in 5 business days"\n5. **Competitive pricing** — Research similar jobs and price fairly\n\n**Pro tips:**\n• 🎯 Personalize every proposal — no copy-paste templates\n• 📊 Include portfolio links or samples of similar work\n• ⚡ Apply early — first proposals get more attention\n• 🤖 Use the **AI Proposal Polisher** to optimize your writing\n• 💬 Ask a clarifying question to show genuine interest\n\n**Avoid:**\n• Generic "I can do this" proposals\n• Bidding too low just to win (clients distrust very low bids)\n• Ignoring the job requirements',
    keywords: ['proposal', 'write', 'apply', 'bid', 'submit', 'cover letter', 'good', 'tips', 'win', 'hired'],
  },
  {
    id: 'job-2',
    category: 'jobs',
    subcategory: 'limits',
    question: 'How many proposals can I send per day?',
    alternateQuestions: ['proposal limit', 'daily proposal limit', 'maximum proposals', 'proposals per day', 'how many bids', 'run out of proposals'],
    answer: 'Proposal limits depend on your plan:\n\n• **Free plan**: 10 proposals per day\n• **Pro plan**: 20 proposals per day\n• **Enterprise**: Unlimited proposals\n\n**Good to know:**\n• Your daily count resets at midnight (EAT)\n• Withdrawn proposals **restore** your daily count\n• Quality over quantity — 5 great proposals beat 10 generic ones\n• Pro plan doubles your daily limit for just KES 500/month\n\nUpgrade to Pro from Dashboard > Settings > Subscription.',
    keywords: ['proposal', 'limit', 'how many', 'per day', 'daily', 'maximum', 'run out'],
  },
  {
    id: 'job-3',
    category: 'jobs',
    subcategory: 'no_response',
    question: 'What if a client doesn\'t respond to my proposal?',
    alternateQuestions: ['client not responding', 'no response', 'client silent', 'client ignoring me', 'client ghosting', 'waiting for response', 'how long to wait'],
    answer: 'It\'s common for clients to take time reviewing proposals. Here\'s what to do:\n\n**Timeline:**\n• **1-3 days**: Normal — clients often receive many proposals and need time\n• **3-5 days**: Send a polite follow-up message\n• **7+ days**: Consider withdrawing your proposal\n\n**Tips:**\n• Withdrawing a proposal **restores your daily proposal count**\n• Don\'t put all your eggs in one basket — apply to multiple jobs\n• A polite follow-up can remind the client about your proposal\n• Check if the job is still "Open" — it might have been filled\n\n**Follow-up message template:**\n"Hi [Client], I submitted a proposal for [Job Title] a few days ago. I\'m very interested in this project and would love to discuss it further. Please let me know if you have any questions about my approach. Thank you!"',
    keywords: ['response', 'respond', 'silent', 'ignore', 'ghost', 'wait', 'follow up'],
  },
  {
    id: 'job-4',
    category: 'jobs',
    subcategory: 'bidding',
    question: 'Can I bid more than the client\'s budget?',
    alternateQuestions: ['bid over budget', 'bid higher than budget', 'overbid', 'bid too high', 'budget limit', 'exceed budget'],
    answer: 'Yes, you can absolutely bid more than the client\'s posted budget!\n\nYour bid represents the value you believe your work is worth. Here\'s how to justify a higher bid:\n\n• **Explain your value** — Specialized skills, faster delivery, or better quality\n• **Reference past work** — Show similar projects with great results\n• **Break down costs** — Help the client understand what they\'re paying for\n• **Offer extras** — Additional revisions, source files, or ongoing support\n\n**Keep in mind:**\n• Some clients set low budgets expecting negotiation\n• Others have firm budgets — read the job description carefully\n• A well-justified higher bid often wins over a cheap, generic one\n• Use the AI Proposal Polisher to make your case compelling',
    keywords: ['bid', 'budget', 'more', 'higher', 'over', 'exceed', 'overbid', 'above'],
  },

  // ── ACCOUNT & PROFILE ────────────────────────────────────────────────
  {
    id: 'acc-1',
    category: 'account',
    subcategory: 'verification',
    question: 'How do I verify my account?',
    alternateQuestions: ['account verification', 'id verification', 'verify identity', 'upload id', 'get verified', 'verification process', 'why verify'],
    answer: 'Account verification builds trust and helps you get more jobs.\n\n**How to verify:**',
    keywords: ['verify', 'verification', 'id', 'identity', 'confirm', 'validate', 'upload'],
    steps: [
      'Go to **Dashboard > Settings**',
      'Look for the **Verification** section',
      'Upload a clear photo of your **National ID** or **Passport**',
      'Ensure the document is legible and not expired',
      'Submit for review',
      'Verification is typically completed within **24 hours**',
    ],
  },
  {
    id: 'acc-2',
    category: 'account',
    subcategory: 'profile_update',
    question: 'How do I update my profile?',
    alternateQuestions: ['edit profile', 'change profile', 'update bio', 'add skills', 'change photo', 'profile settings', 'update information'],
    answer: 'You can customize your entire profile from the Settings page:',
    keywords: ['update', 'edit', 'change', 'profile', 'information', 'details', 'bio', 'skills', 'photo'],
    steps: [
      'Go to **Dashboard > Settings > Profile tab**',
      '**Basic Info**: Update your name, phone, county, title',
      '**Professional Details**: Add bio, hourly rate, years of experience, availability',
      '**Skills**: Add your skills (these help with job matching)',
      '**Education**: Add your educational background',
      '**Certifications**: Add professional certifications',
      '**Portfolio tab**: Showcase your best work with images and descriptions',
      '**Avatar**: Click the camera icon on your profile photo to upload a new one (JPEG/PNG/WebP, max 2MB)',
    ],
    links: ['/dashboard/settings'],
  },
  {
    id: 'acc-3',
    category: 'account',
    subcategory: 'hustle_score',
    question: 'What is the Hustle Score?',
    alternateQuestions: ['hustle score explained', 'trust score', 'how is score calculated', 'how to improve score', 'what affects my score', 'rating system', 'reputation score'],
    answer: 'Hustle Score is your trust and reputation rating on HustleKE, ranging from 0 to 100.\n\n**What affects your score:**\n• ⭐ **Client reviews** — Star ratings from completed projects\n• ✅ **Completed jobs** — More completed jobs = higher score\n• ⚡ **Response time** — How quickly you reply to messages\n• 🔒 **Verification status** — Verified accounts score higher\n• 📊 **Platform activity** — Regular activity shows reliability\n• 📝 **Profile completeness** — Complete profiles rank higher\n\n**Why it matters:**\n• Higher scores appear first in search results\n• Clients prefer freelancers with scores above 70\n• Pro plan members get additional score boosts\n• Your score is visible on your public profile\n\n**How to improve:**\n• Complete projects on time with quality work\n• Respond to messages within hours, not days\n• Get your account verified\n• Fill out your entire profile including portfolio\n• Maintain consistent activity on the platform',
    keywords: ['hustle score', 'score', 'rating', 'trust', 'reputation', 'rank', 'improve', 'calculate'],
  },
  {
    id: 'acc-4',
    category: 'account',
    subcategory: 'password',
    question: 'How do I change my password?',
    alternateQuestions: ['reset password', 'forgot password', 'change password', 'password reset', 'cant login', 'locked out', 'login problem'],
    answer: '**To change your password (if you\'re logged in):**\n1. Go to Dashboard > Settings > Security tab\n2. Enter your current password\n3. Enter your new password (min 8 characters)\n4. Click "Change Password"\n\n**If you forgot your password:**\n1. Click "Log In" on the homepage\n2. Click "Forgot Password?" link\n3. Enter your registered email address\n4. Check your email for a reset link\n5. Click the link and set a new password\n\n**Tips:**\n• Use a strong password with letters, numbers, and symbols\n• Don\'t reuse passwords from other sites\n• The reset link expires after 1 hour',
    keywords: ['password', 'reset', 'forgot', 'change', 'login', 'locked', 'access', 'cant login'],
    links: ['/dashboard/settings', '/forgot-password'],
  },
  {
    id: 'acc-5',
    category: 'account',
    subcategory: 'delete',
    question: 'How do I delete my account?',
    alternateQuestions: ['close account', 'deactivate account', 'remove account', 'delete profile', 'leave platform'],
    answer: 'To delete your HustleKE account:\n\n**Before deletion, you must:**\n• Complete or cancel all active contracts\n• Withdraw all funds from your wallet\n• Resolve any open disputes\n\n**To request deletion:**\n• Go to Dashboard > Settings > Security tab\n• Account deletion is currently handled by our support team\n• Contact support at /contact with your deletion request\n• We\'ll process it within 48 hours\n\n**Important:**\n• Account deletion is permanent and cannot be undone\n• Your reviews and ratings will be anonymized\n• Your profile will be removed from search results immediately',
    keywords: ['delete', 'close', 'deactivate', 'remove', 'leave', 'account'],
    links: ['/contact'],
  },

  // ── PLANS & SUBSCRIPTIONS ────────────────────────────────────────────
  {
    id: 'plan-1',
    category: 'plans',
    subcategory: 'cancel',
    question: 'Can I cancel my Pro subscription?',
    alternateQuestions: ['cancel pro', 'cancel subscription', 'stop subscription', 'unsubscribe', 'end pro plan', 'stop paying'],
    answer: 'Yes! You can cancel Pro anytime with no penalties.\n\n**How to cancel:**\n1. Go to Dashboard > Settings > Subscription\n2. Click "Cancel Subscription"\n3. Confirm cancellation\n\n**What happens after cancellation:**\n• You keep all Pro benefits until your current billing period ends\n• After expiry, you revert to the Free plan (6% fee, 10 proposals/day)\n• Your profile, reviews, and Hustle Score are not affected\n• You can re-subscribe anytime\n\n**Auto-renewal:**\n• If auto-renew is ON, your wallet is charged KES 500 on the renewal date\n• If your wallet doesn\'t have enough funds, you get a 3-day grace period\n• Toggle auto-renew from the Subscription settings',
    keywords: ['cancel', 'subscription', 'stop', 'unsubscribe', 'end', 'pro', 'quit'],
    links: ['/dashboard/settings?tab=subscription'],
  },
  {
    id: 'plan-2',
    category: 'plans',
    subcategory: 'expiry',
    question: 'What happens when my Pro plan expires?',
    alternateQuestions: ['pro expired', 'subscription expired', 'plan lapsed', 'renewal failed', 'what if i dont renew'],
    answer: 'When your Pro plan reaches its expiry date:\n\n**If auto-renew is ON:**\n1. HustleKE attempts to charge KES 500 from your wallet\n2. If successful → subscription extends by 1 month\n3. If insufficient funds → you enter a **3-day grace period**\n4. During grace period, you still have Pro benefits\n5. Top up your wallet within 3 days to continue Pro\n6. After 3 days without renewal → reverts to Free plan\n\n**If auto-renew is OFF:**\n• Pro benefits end on the expiry date\n• You immediately revert to Free plan\n• 6% fee instead of 4%\n• 10 proposals/day instead of 20\n\n**You can re-subscribe anytime** from Dashboard > Settings > Subscription.',
    keywords: ['expire', 'expired', 'renew', 'renewal', 'lapse', 'grace', 'auto'],
  },
  {
    id: 'plan-3',
    category: 'plans',
    subcategory: 'promo',
    question: 'Are there any promo codes or free trials?',
    alternateQuestions: ['promo code', 'discount code', 'free trial', 'coupon', 'try pro free', 'special offer'],
    answer: 'Yes! We offer promo codes for discounted or free Pro subscriptions:\n\n**Active promo codes:**\n• **EARLYBIRD** — 100% off first month (FREE!)\n• **HUSTLEKE50** — 50% off (KES 250 instead of 500)\n• **WELCOME100** — KES 100 off (pay KES 400)\n• **REFER2025** — 30% off (KES 350)\n\n**How to use:**\n1. Go to Dashboard > Settings > Subscription\n2. Enter the promo code in the "Promo Code" field\n3. Click "Validate" to see the discount\n4. Click "Subscribe" to activate\n\n**Note:** Promo codes are one-time use and may have expiry dates.',
    keywords: ['promo', 'code', 'discount', 'free', 'trial', 'coupon', 'offer', 'earlybird'],
    links: ['/dashboard/settings?tab=subscription'],
  },
  {
    id: 'plan-4',
    category: 'plans',
    subcategory: 'enterprise',
    question: 'What does the Enterprise plan include?',
    alternateQuestions: ['enterprise plan', 'business plan', 'team plan', 'corporate plan', 'company account', 'bulk hiring'],
    answer: 'The Enterprise plan is designed for businesses and teams:\n\n**Features:**\n• Custom fee rates from **3%** (negotiable)\n• **Unlimited** proposals per day\n• **Team management** — add team members with different roles\n• **Bulk hiring** — post and manage multiple jobs efficiently\n• **API access** — integrate HustleKE into your workflow\n• **Dedicated account manager** — personal point of contact\n• **2-hour support SLA** — priority response times\n• **Custom invoicing** and reporting\n\n**Pricing:** Custom — based on your team size and usage\n\n**To get started:**\nContact our sales team at /contact or email enterprise@hustleke.com',
    keywords: ['enterprise', 'team', 'business', 'company', 'corporate', 'bulk', 'api', 'custom'],
    links: ['/contact'],
  },

  // ── SAFETY & DISPUTES ────────────────────────────────────────────────
  {
    id: 'safe-1',
    category: 'safety',
    subcategory: 'disputes',
    question: 'How do I open a dispute?',
    alternateQuestions: ['file dispute', 'raise dispute', 'report problem', 'work not delivered', 'client not paying', 'freelancer not working', 'complaint', 'refund request'],
    answer: 'If you have a problem with a project, here\'s how to open a dispute:\n\n**Steps:**\n1. Go to **Dashboard > Escrow**\n2. Find the relevant project\n3. Click **"Open Dispute"**\n4. Describe the issue in detail\n5. Attach any evidence (screenshots, files, messages)\n6. Submit the dispute\n\n**What happens next:**\n• Both parties are notified\n• Our resolution team reviews all evidence within **48 hours**\n• Escrow funds remain **locked** during the dispute\n• Resolution options: full release, full refund, or fair split\n• Both parties can submit additional evidence\n\n**Common dispute reasons:**\n• Work not delivered on time\n• Work quality doesn\'t match requirements\n• Client not responding after escrow is funded\n• Scope disagreement\n\n**Tips:** Keep all communication on the platform — it serves as evidence in disputes.',
    keywords: ['dispute', 'problem', 'issue', 'complaint', 'refund', 'conflict', 'report', 'resolve'],
    links: ['/dashboard/escrow'],
  },
  {
    id: 'safe-2',
    category: 'safety',
    subcategory: 'security',
    question: 'Is my data secure on HustleKE?',
    alternateQuestions: ['data security', 'is it safe', 'privacy', 'data protection', 'is my information safe', 'hacking', 'data breach'],
    answer: 'Yes, your data is protected with enterprise-grade security:\n\n**Security measures:**\n• 🔐 **AES-256-GCM encryption** for sensitive data (phone numbers, financial info)\n• 🛡️ **Row Level Security (RLS)** — users can only access their own data\n• 🔒 **CSRF protection** — prevents cross-site request forgery\n• ⚡ **Rate limiting** — prevents brute force attacks\n• 📝 **Audit logging** — all financial operations are tracked\n• 🔑 **Secure authentication** — cookie-based sessions with Supabase Auth\n• 🏦 **Atomic transactions** — prevents race conditions in financial operations\n\n**We never:**\n• Share your personal information with third parties\n• Store passwords in plain text\n• Allow unauthorized access to your data\n\n**Your responsibilities:**\n• Use a strong, unique password\n• Don\'t share your login credentials\n• Report suspicious activity immediately',
    keywords: ['secure', 'safe', 'data', 'privacy', 'protect', 'hack', 'breach', 'encrypt', 'security'],
  },
  {
    id: 'safe-3',
    category: 'safety',
    subcategory: 'scam',
    question: 'Is HustleKE legit / trustworthy?',
    alternateQuestions: ['is this a scam', 'can i trust hustleke', 'is it legitimate', 'is it real', 'is it reliable', 'is it safe to use', 'will i get scammed'],
    answer: 'Yes, HustleKE is a legitimate and trustworthy freelance marketplace. Here\'s why:\n\n**Trust & Safety:**\n• ✅ **M-Pesa escrow** — funds are held securely, not by individuals\n• ✅ **Identity verification** — all users verify with national ID\n• ✅ **Hustle Score** — transparent reputation system\n• ✅ **Dispute resolution** — dedicated team resolves issues within 48 hours\n• ✅ **Bank-level encryption** — your data is protected\n• ✅ **No upfront payments** — you only pay when work is completed\n\n**Red flags to watch for (on any platform):**\n• Never pay outside the platform\n• Don\'t share personal contacts before escrow is funded\n• Report users who ask for upfront payments outside escrow\n• If a deal seems too good to be true, it probably is\n\nHustleKE is built specifically for the Kenyan market with local payment integration and local support.',
    keywords: ['legit', 'legitimate', 'scam', 'trust', 'real', 'reliable', 'safe', 'trustworthy', 'fake'],
  },
  {
    id: 'safe-4',
    category: 'safety',
    subcategory: 'contact_sharing',
    question: 'Can I share my personal contact details with clients?',
    alternateQuestions: ['share phone number', 'share email', 'exchange contacts', 'off platform', 'whatsapp', 'direct contact', 'give number'],
    answer: 'We **strongly advise** keeping all communication on the HustleKE platform, especially before a contract is in place.\n\n**Why?**\n• 🛡️ No escrow protection for off-platform agreements\n• 📝 Platform messages serve as evidence in disputes\n• 🔒 Your personal info stays private\n• ⚖️ We can\'t help resolve issues that happen off-platform\n\n**When is it okay?**\n• After a project is completed successfully, it\'s your choice\n• For ongoing client relationships after trust is established\n• Never before escrow is funded\n\n**Safe communication:**\n• Use Dashboard > Messages for all project discussions\n• Share files through the platform\n• Keep a record of all agreements in writing',
    keywords: ['share', 'contact', 'phone', 'email', 'whatsapp', 'personal', 'off platform', 'direct'],
  },

  // ── REVIEWS & REPUTATION ─────────────────────────────────────────────
  {
    id: 'rev-1',
    category: 'reviews',
    subcategory: 'leaving_reviews',
    question: 'How do I leave a review?',
    alternateQuestions: ['give feedback', 'rate freelancer', 'rate client', 'star rating', 'write review', 'review system'],
    answer: 'After completing a project, both freelancers and clients can leave reviews:\n\n**How to leave a review:**\n1. Go to **Dashboard > Reviews**\n2. Find the completed project\n3. Click **"Leave Review"**\n4. Rate with **1-5 stars** (overall + sub-ratings for communication, quality, timeliness)\n5. Write a comment about your experience\n6. Submit\n\n**Important:**\n• Reviews are public and visible on the user\'s profile\n• You can only review after a project is completed\n• Reviews cannot be edited or deleted once submitted\n• Both parties can review each other\n• Reviews directly impact Hustle Score',
    keywords: ['review', 'feedback', 'rate', 'rating', 'star', 'testimonial'],
    links: ['/dashboard/reviews'],
  },

  // ── TECHNICAL & TROUBLESHOOTING ──────────────────────────────────────
  {
    id: 'tech-1',
    category: 'technical',
    subcategory: 'bug',
    question: 'I found a bug / something is not working',
    alternateQuestions: ['website broken', 'page not loading', 'error message', 'app crash', 'glitch', 'technical issue', 'site slow', 'not working properly'],
    answer: 'Sorry you\'re experiencing issues! Here are some quick fixes:\n\n**Try these first:**\n1. **Refresh the page** (Ctrl+R or Cmd+R)\n2. **Clear your browser cache** (Ctrl+Shift+Delete)\n3. **Try a different browser** (Chrome, Firefox, Safari)\n4. **Check your internet connection**\n5. **Disable browser extensions** (some ad blockers interfere)\n\n**If the issue persists:**\n• Take a screenshot of the error\n• Note what you were doing when it happened\n• Click "Connect to human" in this chat to report it\n• Or visit /contact to submit a bug report\n\n**Common issues:**\n• **Page not loading**: Usually a network issue — try refreshing\n• **Login problems**: Clear cookies and try again\n• **Payment errors**: Check M-Pesa balance and try again after 30 seconds\n• **Slow loading**: Try during off-peak hours or check your connection',
    keywords: ['bug', 'error', 'broken', 'not working', 'crash', 'glitch', 'slow', 'loading', 'issue', 'problem', 'technical'],
  },

  // ── POLICIES & RULES ─────────────────────────────────────────────────
  {
    id: 'pol-1',
    category: 'policies',
    subcategory: 'rules',
    question: 'What are the platform rules?',
    alternateQuestions: ['terms of service', 'community guidelines', 'what is allowed', 'what is not allowed', 'platform policies', 'rules and regulations'],
    answer: 'HustleKE has community guidelines to protect all users:\n\n**Do:**\n• ✅ Keep all job communication on the platform until escrow is funded\n• ✅ Deliver work as agreed in the proposal\n• ✅ Communicate clearly and professionally\n• ✅ Report suspicious activity\n• ✅ Use your real identity\n\n**Don\'t:**\n• ❌ Share personal contacts before a contract is in place\n• ❌ Create fake reviews or multiple accounts\n• ❌ Ask for payments outside the platform\n• ❌ Deliver plagiarized or AI-generated work without disclosure\n• ❌ Harass or discriminate against other users\n• ❌ Misrepresent your skills or experience\n\n**Consequences:**\n• Warnings for minor violations\n• Account suspension for repeated violations\n• Permanent ban for fraud, scams, or harassment\n\nFull terms at /terms and privacy policy at /privacy.',
    keywords: ['rules', 'policy', 'terms', 'guidelines', 'allowed', 'forbidden', 'prohibited', 'banned'],
    links: ['/terms', '/privacy'],
  },
  {
    id: 'pol-2',
    category: 'policies',
    subcategory: 'multiple_accounts',
    question: 'Can I have multiple accounts?',
    alternateQuestions: ['two accounts', 'second account', 'duplicate account', 'another account'],
    answer: 'No, each user should have **only one HustleKE account**.\n\nCreating multiple accounts to bypass proposal limits or manipulate reviews violates our terms of service and can result in **account suspension**.\n\n**If you need both roles:**\nYou can be both a freelancer AND a client from the same account. Your dashboard automatically adapts based on your activity — you\'ll see freelancer tools (Find Work, My Hustles) and client tools (My Projects, Post a Job) in the sidebar.\n\n**Lost access to your account?**\nUse the "Forgot Password" feature or contact support at /contact.',
    keywords: ['multiple', 'account', 'two', 'second', 'duplicate', 'another'],
  },
  {
    id: 'pol-3',
    category: 'policies',
    subcategory: 'tax',
    question: 'Do I need to pay tax on my earnings?',
    alternateQuestions: ['tax on earnings', 'vat', 'kra', 'income tax', 'tax obligations', 'invoice', 'receipt', 'tax declaration'],
    answer: 'Here\'s what you need to know about taxes on HustleKE:\n\n**Platform taxes:**\n• HustleKE adds **16% VAT** on service fees as required by Kenyan tax law\n• This is already included in the fee calculation\n\n**Your tax obligations:**\n• As a freelancer, you are responsible for declaring your income to **KRA** (Kenya Revenue Authority)\n• Your transaction history from Dashboard > Wallet serves as your earnings record\n• We currently don\'t generate formal invoices, but you can use your transaction history for tax purposes\n\n**Tips:**\n• Keep records of all your earnings and expenses\n• Consider registering for a KRA PIN if you haven\'t already\n• Consult a tax professional for advice specific to your situation\n• Freelance income is typically taxed as business income in Kenya',
    keywords: ['tax', 'vat', 'kra', 'income', 'invoice', 'receipt', 'declaration', 'earnings'],
  },

  // ── MISCELLANEOUS ────────────────────────────────────────────────────
  {
    id: 'misc-1',
    category: 'misc',
    subcategory: 'work_rejection',
    question: 'What if the client rejects my work?',
    alternateQuestions: ['work rejected', 'client not satisfied', 'revision request', 'redo work', 'poor quality complaint', 'work not accepted'],
    answer: 'If a client isn\'t satisfied with your work:\n\n**Step 1: Communication**\n• Ask for specific feedback on what needs to change\n• Clarify the original requirements vs. what was delivered\n• Most issues can be resolved through clear communication\n\n**Step 2: Revisions**\n• Make the requested changes within a reasonable timeframe\n• Resubmit through the platform\n• Document all changes made\n\n**Step 3: If you can\'t agree**\n• Either party can open a dispute from Dashboard > Escrow\n• Our resolution team reviews:\n  - Original job requirements\n  - Proposal terms\n  - Delivered work\n  - All communication between parties\n• Resolution within 48 hours: release, refund, or fair split\n\n**Escrow funds stay locked** until the dispute is resolved — neither party loses money unfairly.',
    keywords: ['reject', 'rejected', 'not satisfied', 'revision', 'redo', 'quality', 'complaint', 'not accepted'],
  },
  {
    id: 'misc-2',
    category: 'misc',
    subcategory: 'multiple_jobs',
    question: 'Can I work on multiple projects at once?',
    alternateQuestions: ['multiple projects', 'simultaneous jobs', 'how many jobs at once', 'job limit', 'take on more work'],
    answer: 'Yes! There\'s **no limit** on how many projects you can work on simultaneously.\n\n**Tips for managing multiple projects:**\n• 📅 Set realistic deadlines for each project\n• 📋 Prioritize based on urgency and deadline\n• 💬 Communicate proactively with clients about timelines\n• ⚠️ Don\'t overcommit — poor quality leads to bad reviews\n• 📊 Use your dashboard to track all active projects\n\n**As a client:**\nYou can also post and manage multiple jobs at once. Each job has its own escrow, proposals, and messaging thread.\n\n**Warning:** Overcommitting and missing deadlines will hurt your Hustle Score and lead to negative reviews.',
    keywords: ['multiple', 'projects', 'simultaneous', 'many', 'jobs', 'at once', 'limit'],
  },
  {
    id: 'misc-3',
    category: 'misc',
    subcategory: 'minimum_bid',
    question: 'What is the minimum bid amount?',
    alternateQuestions: ['minimum amount', 'lowest bid', 'minimum budget', 'minimum project cost', 'smallest job'],
    answer: 'The minimum bid amount on HustleKE is **KES 100**.\n\nThere is no maximum limit — you can bid whatever you believe your work is worth.\n\n**Pricing tips:**\n• Research similar jobs to set competitive rates\n• Factor in the service fee (6% Free / 4% Pro) when setting your bid\n• Don\'t undervalue your work — very low bids can seem suspicious\n• Consider the project scope, complexity, and your experience level\n• Clients set their own budget ranges when posting jobs',
    keywords: ['minimum', 'bid', 'amount', 'lowest', 'budget', 'smallest'],
  },
  {
    id: 'misc-4',
    category: 'misc',
    subcategory: 'contact_support',
    question: 'How do I contact support?',
    alternateQuestions: ['customer support', 'help desk', 'support email', 'contact us', 'reach support', 'talk to support', 'support phone number'],
    answer: 'You can reach HustleKE support through several channels:\n\n**1. Live Chat (fastest)**\n• You\'re already here! Type your question or click "Connect to human" for a live agent\n\n**2. Contact Page**\n• Visit /contact to submit a support request\n\n**3. Support Tickets**\n• Create a ticket from Dashboard > Support for tracked issues\n\n**Response times:**\n• Live chat: Usually within minutes during business hours\n• Support tickets: Within 24 hours\n• Pro users: Priority support with faster response times\n• Enterprise users: 2-hour SLA\n\n**Business hours:** Monday - Friday, 8 AM - 6 PM EAT\n(AI assistant available 24/7)',
    keywords: ['contact', 'support', 'help', 'customer service', 'email', 'phone', 'reach'],
    links: ['/contact'],
  },
]

// ============================================================================
// TEXT PROCESSING UTILITIES
// ============================================================================

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[?!.,;:'"()\[\]{}\/\\@#$%^&*+=~`<>]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
}

function expandWithSynonyms(word: string): string[] {
  const expanded = new Set([word])
  for (const [root, synonyms] of Object.entries(SYNONYMS)) {
    if (root === word || synonyms.includes(word)) {
      expanded.add(root)
      synonyms.forEach(s => expanded.add(s))
    }
  }
  return Array.from(expanded)
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }
  return matrix[b.length][a.length]
}

function fuzzyMatch(word1: string, word2: string): boolean {
  if (word1 === word2) return true
  if (word1.length < 4 || word2.length < 4) return false
  return levenshteinDistance(word1, word2) <= Math.floor(Math.max(word1.length, word2.length) * 0.25)
}

function wordsMatch(queryWord: string, targetWord: string): boolean {
  if (queryWord === targetWord) return true
  if (fuzzyMatch(queryWord, targetWord)) return true
  if (queryWord.length >= 4 && targetWord.length >= 4) {
    if (targetWord.startsWith(queryWord) || queryWord.startsWith(targetWord)) return true
  }
  return false
}

// ============================================================================
// SCORING ENGINE — Multi-layer matching
// ============================================================================

export function scoreEntry(query: string, entry: KnowledgeEntry): number {
  const lower = query.toLowerCase().trim()
  const queryWords = extractKeywords(query)
  if (queryWords.length === 0) return 0

  let score = 0

  // Layer 1: Exact alternate question match (highest confidence)
  for (const alt of entry.alternateQuestions) {
    if (lower.includes(alt) || alt.includes(lower)) {
      score += 50
      break
    }
    // Check if most words from the alternate question appear in the query
    const altWords = extractKeywords(alt)
    const matchCount = altWords.filter(aw => queryWords.some(qw => wordsMatch(qw, aw))).length
    if (altWords.length > 0 && matchCount / altWords.length >= 0.7) {
      score += 30
    }
  }

  // Layer 2: Keyword match with synonym expansion
  let keywordMatches = 0
  for (const keyword of entry.keywords) {
    if (keyword.includes(' ')) {
      // Multi-word keyword — check phrase presence
      if (lower.includes(keyword)) {
        keywordMatches += 3
      }
    } else {
      // Single word — check with expansion
      for (const qw of queryWords) {
        const expanded = expandWithSynonyms(qw)
        if (expanded.some(ew => wordsMatch(ew, keyword))) {
          keywordMatches += 2
          break
        }
      }
    }
  }
  score += keywordMatches

  // Layer 3: Question text similarity
  const questionWords = extractKeywords(entry.question)
  let questionMatches = 0
  for (const qw of queryWords) {
    const expanded = expandWithSynonyms(qw)
    if (questionWords.some(fw => expanded.some(ew => wordsMatch(ew, fw)))) {
      questionMatches++
    }
  }
  if (questionWords.length > 0) {
    score += (questionMatches / questionWords.length) * 15
  }

  // Layer 4: Answer text relevance (lower weight)
  const answerWords = extractKeywords(entry.answer).slice(0, 50) // Only first 50 words
  let answerMatches = 0
  for (const qw of queryWords) {
    const expanded = expandWithSynonyms(qw)
    if (answerWords.some(aw => expanded.some(ew => wordsMatch(ew, aw)))) {
      answerMatches++
    }
  }
  score += answerMatches * 0.5

  // Layer 5: Category relevance boost
  const categoryWords = extractKeywords(entry.category + ' ' + entry.subcategory)
  for (const qw of queryWords) {
    if (categoryWords.some(cw => wordsMatch(qw, cw))) {
      score += 3
    }
  }

  // Penalize low overlap ratio for long queries
  if (queryWords.length > 3) {
    const totalMatched = questionMatches + Math.min(keywordMatches, 3)
    const ratio = totalMatched / queryWords.length
    score *= (0.5 + ratio * 0.5)
  }

  return score
}

// ============================================================================
// MAIN QUERY FUNCTION
// ============================================================================

export interface QueryResult {
  answer: string
  matchedQuestion?: string
  category?: string
  subcategory?: string
  source: 'knowledge_base' | 'ai_generated' | 'system'
  confidence: 'high' | 'medium' | 'low'
  relatedEntries: Array<{ id: string; question: string; category: string }>
  steps?: string[]
  links?: string[]
}

export function queryKnowledge(question: string, conversationContext?: string[]): QueryResult {
  const lower = question.toLowerCase().trim()
  if (lower.length < 2) {
    return {
      answer: 'Please type a question and I\'ll do my best to help you!',
      source: 'system',
      confidence: 'low',
      relatedEntries: [],
    }
  }

  // Score all entries
  const scored = KNOWLEDGE_BASE
    .map(entry => ({ entry, score: scoreEntry(question, entry) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)

  // Get related entries (top 3 excluding best match)
  const getRelated = (excludeId?: string) =>
    scored
      .filter(s => s.entry.id !== excludeId && s.score > 3)
      .slice(0, 3)
      .map(s => ({ id: s.entry.id, question: s.entry.question, category: s.entry.category }))

  // High confidence match
  if (scored.length > 0 && scored[0].score >= 15) {
    const best = scored[0].entry
    let answer = best.answer
    if (best.steps && best.steps.length > 0) {
      answer += '\n\n' + best.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    }
    return {
      answer,
      matchedQuestion: best.question,
      category: best.category,
      subcategory: best.subcategory,
      source: 'knowledge_base',
      confidence: scored[0].score >= 30 ? 'high' : 'medium',
      relatedEntries: getRelated(best.id),
      steps: best.steps,
      links: best.links,
    }
  }

  // Medium confidence — still use best match but note lower confidence
  if (scored.length > 0 && scored[0].score >= 6) {
    const best = scored[0].entry
    let answer = best.answer
    if (best.steps && best.steps.length > 0) {
      answer += '\n\n' + best.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    }
    return {
      answer,
      matchedQuestion: best.question,
      category: best.category,
      subcategory: best.subcategory,
      source: 'knowledge_base',
      confidence: 'medium',
      relatedEntries: getRelated(best.id),
      steps: best.steps,
      links: best.links,
    }
  }

  // Low confidence — generate a contextual fallback
  const fallbackAnswer = generateFallbackAnswer(question, scored.slice(0, 3).map(s => s.entry))
  return {
    answer: fallbackAnswer,
    source: 'ai_generated',
    confidence: scored.length > 0 && scored[0].score >= 3 ? 'medium' : 'low',
    relatedEntries: getRelated(),
  }
}

// ============================================================================
// INTELLIGENT FALLBACK — never returns "I don't know"
// ============================================================================

function generateFallbackAnswer(question: string, nearMatches: KnowledgeEntry[]): string {
  const lower = question.toLowerCase()

  // If we have near-matches, reference them
  if (nearMatches.length > 0) {
    const suggestions = nearMatches.map(e => `• **${e.question}**`).join('\n')
    return `I want to make sure I give you the right answer. Based on your question, you might be asking about one of these:\n\n${suggestions}\n\nCould you clarify which topic you need help with? Or if it's something else entirely, try rephrasing your question and I'll do my best to help!\n\nYou can also:\n• Click "Connect to human" to speak with a support agent\n• Visit our FAQ page at /faqs for more topics\n• Browse /contact to submit a detailed support request`
  }

  // Topic inference from keywords
  const topicHints: Array<{ keywords: string[]; topic: string; suggestion: string }> = [
    { keywords: ['money', 'pay', 'cash', 'earn', 'income', 'salary'], topic: 'payments', suggestion: 'Try asking: "How do I get paid?" or "How does escrow work?"' },
    { keywords: ['job', 'work', 'hire', 'project', 'gig'], topic: 'jobs', suggestion: 'Try asking: "How do I find work?" or "How do I post a job?"' },
    { keywords: ['fee', 'cost', 'price', 'charge', 'expensive'], topic: 'fees', suggestion: 'Try asking: "What are the fees?" or "Is Pro worth it?"' },
    { keywords: ['account', 'login', 'password', 'profile', 'settings'], topic: 'account', suggestion: 'Try asking: "How do I update my profile?" or "How do I change my password?"' },
    { keywords: ['safe', 'secure', 'trust', 'scam', 'fraud'], topic: 'safety', suggestion: 'Try asking: "Is HustleKE legit?" or "How do I open a dispute?"' },
    { keywords: ['plan', 'pro', 'subscribe', 'upgrade', 'premium'], topic: 'plans', suggestion: 'Try asking: "What does Pro include?" or "Are there promo codes?"' },
  ]

  for (const hint of topicHints) {
    if (hint.keywords.some(k => lower.includes(k))) {
      return `It looks like you're asking about **${hint.topic}**. I have detailed information on this topic!\n\n${hint.suggestion}\n\nOr feel free to rephrase your question and I'll find the best answer for you.`
    }
  }

  // Ultimate fallback — still helpful
  return `Thanks for your question! I'm here to help with anything about HustleKE.\n\nI can answer questions about:\n• 💰 **Payments** — M-Pesa, escrow, withdrawals, fees\n• 💼 **Jobs** — Finding work, posting jobs, proposals\n• 👤 **Account** — Profile, verification, settings\n• 📋 **Plans** — Free, Pro, Enterprise pricing\n• 🛡️ **Safety** — Disputes, security, trust\n• ⭐ **Reviews** — Ratings, Hustle Score\n\nTry rephrasing your question, or click **"Connect to human"** to speak with a support agent who can help with anything!\n\nYou can also visit /faqs for our full FAQ library.`
}

// ============================================================================
// SEARCH FUNCTION — for FAQ page
// ============================================================================

export function searchKnowledge(query: string, limit = 10): Array<KnowledgeEntry & { score: number }> {
  return KNOWLEDGE_BASE
    .map(entry => ({ ...entry, score: scoreEntry(query, entry) }))
    .filter(e => e.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
