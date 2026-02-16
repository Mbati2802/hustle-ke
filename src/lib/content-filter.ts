// Content filtering system to prevent contact sharing in messages
// Blocks: phone numbers, email addresses, social media handles, URLs, etc.

// Kenyan phone patterns: +254..., 07..., 01..., with various separators
const PHONE_PATTERNS = [
  /(?:\+?254|0)[17]\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2,3}/gi,
  /\b\d{4}[\s.-]?\d{3}[\s.-]?\d{3}\b/g, // 0712 345 678
  /\b\d{10,13}\b/g, // Raw 10-13 digit numbers (phone-length)
  // Obfuscated: "zero seven one two..." or "plus two five four"
  /(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine)){6,}/gi,
  // Spaced digits: 0 7 1 2 3 4 5 6 7 8
  /\b\d(?:\s+\d){7,}\b/g,
]

// Email patterns
const EMAIL_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  // Obfuscated: "name at gmail dot com"
  /\b\w+[\s]*(?:at|@|AT)[\s]*\w+[\s]*(?:dot|\.|\s*DOT\s*)[\s]*(?:com|co\.ke|org|net|io|gmail|yahoo|hotmail|outlook)\b/gi,
  // "my email is" followed by anything
  /(?:my\s+)?email\s*(?:is|:)\s*\S+/gi,
]

// Social media / messaging app patterns
const SOCIAL_PATTERNS = [
  // WhatsApp references
  /whats\s*app/gi,
  /wh?ats?\s*up/gi,
  /wa\s*me/gi,
  /wa\.me/gi,
  // Telegram
  /telegram/gi,
  /t\.me\//gi,
  // Instagram
  /instagram/gi,
  /\b(?:ig|insta)\s*(?:is|:|\s)\s*@?\w+/gi,
  // Twitter/X
  /twitter/gi,
  /\bx\.com\//gi,
  // Facebook
  /facebook/gi,
  /\bfb\.com\//gi,
  /messenger/gi,
  // TikTok
  /tiktok/gi,
  // Snapchat
  /snapchat/gi,
  /\bsnap\s*(?:is|:|\s)\s*@?\w+/gi,
  // LinkedIn
  /linkedin/gi,
  // Signal
  /\bsignal\s+(?:me|app|number)/gi,
  // Generic social handles
  /(?:find|reach|contact|text|call|dm|message|hit)\s+(?:me|us)\s+(?:on|at|via|through)\s+/gi,
  /(?:my|add\s+me\s+on)\s+(?:ig|insta|snap|fb|twitter|tiktok|whatsapp|telegram|signal)/gi,
  // "@username" style handles (but not in email context)
  /(?:^|\s)@[a-zA-Z]\w{2,}/gm,
]

// URL patterns
const URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  // Common URL shorteners
  /bit\.ly\/[^\s]+/gi,
  /goo\.gl\/[^\s]+/gi,
  /tinyurl\.com\/[^\s]+/gi,
]

// "Call me" / "text me" / contact-soliciting language
// These patterns detect intent to exchange contact info, not just the word "contact"
const CONTACT_SOLICITING = [
  /(?:call|text|ring|buzz|reach)\s+me\s+(?:on|at)\s+/gi,
  /(?:my|the)\s+(?:number|phone|cell|mobile|line|digits)\s+(?:is|:)/gi,
  /(?:here(?:'s| is))\s+my\s+(?:number|phone|contact|email)/gi,
  /(?:send|give|share|drop)\s+(?:me\s+)?(?:your|ur|my)\s+(?:number|phone|contact|email|digits)/gi,
  /(?:let'?s?\s+)?(?:talk|chat|connect|meet)\s+(?:on|via|through|outside)/gi,
  /(?:outside|off)\s+(?:the\s+)?(?:platform|app|site|hustleke)/gi,
  // "can I get/have your number/contact/email"
  /(?:can|could|may)\s+i\s+(?:get|have|know|see)\s+(?:your|ur)\s+(?:number|phone|contact|email|digits|line)/gi,
  // "what's your number/contact/email"
  /(?:what(?:'?s| is))\s+(?:your|ur)\s+(?:number|phone|contact|email|line)/gi,
  // "how can I reach/contact you"
  /(?:how\s+(?:can|do|will)\s+i)\s+(?:reach|contact|call|text|get\s+(?:hold\s+of|to))\s+(?:you|u)/gi,
  // "I'll give/send you my number"
  /(?:i(?:'?ll?| will| can)?)\s+(?:give|send|share|drop)\s+(?:you|u)\s+(?:my)\s+(?:number|phone|contact|email|digits)/gi,
  // "do you have whatsapp/telegram" — but whatsapp/telegram already caught by SOCIAL_PATTERNS
  // "hit me up on"
  /(?:hit|hmu|ping)\s+(?:me\s+)?(?:up\s+)?(?:on|at)/gi,
  // "leave your number/contact"
  /(?:leave|put|type)\s+(?:your|ur)\s+(?:number|phone|contact|email)/gi,
  // "let me have your number/contact"
  /(?:let\s+me)\s+(?:have|get|know)\s+(?:your|ur)\s+(?:number|phone|contact|email)/gi,
]

export interface ContentFilterResult {
  blocked: boolean
  reason: string
  matches: string[]
}

export function scanMessageContent(content: string): ContentFilterResult {
  const matches: string[] = []
  const reasons: string[] = []

  // Normalize: replace common obfuscation tricks
  const normalized = content
    .replace(/[()[\]{}]/g, '') // Remove brackets
    .replace(/[_*~`]/g, '')   // Remove markdown formatting

  // Check phone patterns
  for (const pattern of PHONE_PATTERNS) {
    const found = normalized.match(pattern)
    if (found) {
      // Filter out numbers that are clearly not phone numbers (prices, dates, etc.)
      const phoneMatches = found.filter(m => {
        const digits = m.replace(/\D/g, '')
        // Must be 9-13 digits to be a phone number
        return digits.length >= 9 && digits.length <= 13
      })
      if (phoneMatches.length > 0) {
        matches.push(...phoneMatches)
        reasons.push('phone number')
      }
    }
  }

  // Check email patterns
  for (const pattern of EMAIL_PATTERNS) {
    const found = normalized.match(pattern)
    if (found) {
      matches.push(...found)
      reasons.push('email address')
    }
  }

  // Check social media patterns
  for (const pattern of SOCIAL_PATTERNS) {
    const found = normalized.match(pattern)
    if (found) {
      matches.push(...found)
      reasons.push('social media reference')
    }
  }

  // Check URL patterns
  for (const pattern of URL_PATTERNS) {
    const found = normalized.match(pattern)
    if (found) {
      matches.push(...found)
      reasons.push('external link')
    }
  }

  // Check contact-soliciting language
  for (const pattern of CONTACT_SOLICITING) {
    const found = normalized.match(pattern)
    if (found) {
      matches.push(...found)
      reasons.push('contact soliciting')
    }
  }

  if (matches.length > 0) {
    const uniqueReasons = Array.from(new Set(reasons))
    return {
      blocked: true,
      reason: `Message blocked: contains ${uniqueReasons.join(', ')}. For your safety, all communication must stay on HustleKE.`,
      matches,
    }
  }

  return { blocked: false, reason: '', matches: [] }
}

// Also scan cover letters in proposals
export function scanProposalContent(content: string): ContentFilterResult {
  return scanMessageContent(content)
}
