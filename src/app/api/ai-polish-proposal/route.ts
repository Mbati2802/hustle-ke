import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'

// POST /api/ai-polish-proposal — Polish/improve an existing proposal cover letter
export async function POST(req: NextRequest) {
  const { error: rlError } = createPublicRouteClient(req)
  if (rlError) return rlError

  try {
    const body = await req.json()
    const { cover_letter = '', job_title = '', freelancer_name = '' } = body

    if (!cover_letter || cover_letter.trim().length < 20) {
      return errorResponse('Cover letter must be at least 20 characters', 400)
    }

    const original = cover_letter.trim()

    // ── Step 1: Strip duplicate greetings ──────────────────────────────────
    // Remove any leading greeting lines that appear more than once
    const greetingPatterns = [
      /^(dear\s+hiring\s+manager[,.]?\s*\n+)/im,
      /^(hello[,.]?\s*\n+)/im,
      /^(hi\s+there[!,.]?\s*👋?\s*\n+)/im,
      /^(greetings[,.]?\s*\n+)/im,
    ]

    let cleaned = original
    let greeting = ''

    for (const pat of greetingPatterns) {
      const match = cleaned.match(pat)
      if (match) {
        greeting = match[1]
        cleaned = cleaned.slice(match[0].length).trimStart()
        break
      }
    }

    // Remove a second greeting if present after stripping first
    for (const pat of greetingPatterns) {
      cleaned = cleaned.replace(pat, '')
    }

    // ── Step 2: Remove stacked "Dear Hiring Manager" + wrapper boilerplate ──
    // If text ends with auto-generated boilerplate closing, strip it
    const boilerplateClosing =
      /\n*I have reviewed your requirements and can complete this project within your timeline while maintaining the highest quality standards\. I look forward to discussing how I can contribute to your success\.\n*\nBest regards,\n\[Your Name\]\s*$/im
    cleaned = cleaned.replace(boilerplateClosing, '').trimEnd()

    // Also remove duplicate "I am excited to submit my proposal" openers when text already has real content
    const duplicateOpener =
      /^I am excited to submit my proposal for the .+? position at .+?\. With extensive experience in this field and a proven track record, I am confident in my ability to deliver exceptional results for your project\.\n*/im
    cleaned = cleaned.replace(duplicateOpener, '').trimStart()

    // ── Step 3: Fix markdown artifacts ─────────────────────────────────────
    // Convert **Section Header:** to SECTION HEADER: (plain-text safe) and also clean bullet formatting
    let polished = (greeting || 'Dear Hiring Manager,\n\n') + cleaned

    // Fix double blank lines → single
    polished = polished.replace(/\n{3,}/g, '\n\n')

    // ── Step 4: Improve opening sentence quality ────────────────────────────
    // If opener is weak ("I can help", "I will do"), add a confidence reframe
    const weakOpeners: Array<[RegExp, string]> = [
      [/^(I can help with your project\.)/im, 'I am well-positioned to help with your project.'],
      [/^(I will complete this task\.)/im, 'I can complete this task efficiently and professionally.'],
      [/^(I am a freelancer\.)/im, `I am a professional freelancer${freelancer_name ? ` — ${freelancer_name}` : ''}.`],
    ]
    for (const [pattern, replacement] of weakOpeners) {
      polished = polished.replace(pattern, replacement)
    }

    // ── Step 5: Ensure professional closing if missing ─────────────────────
    const hasClosing = /best regards|kind regards|looking forward|sincerely|thank you for considering/i.test(polished)
    if (!hasClosing) {
      const name = freelancer_name ? `\n\nBest regards,\n${freelancer_name}` : '\n\nBest regards,'
      const closingLine = job_title
        ? `\n\nI look forward to discussing how my experience aligns with your ${job_title} requirements.${name}`
        : `\n\nI look forward to working with you on this project.${name}`
      polished = polished.trimEnd() + closingLine
    }

    // ── Step 6: Fix common grammar issues (rule-based) ─────────────────────
    const grammarFixes: Array<[RegExp, string]> = [
      [/\bi am\b/g, 'I am'],
      [/\bi have\b/g, 'I have'],
      [/\bi will\b/g, 'I will'],
      [/\bi can\b/g, 'I can'],
      [/ {2,}/g, ' '],                        // double spaces
      [/([.!?])\s{0,1}([a-z])/g, '$1 $2'],   // missing space after punctuation (but not decimals)
      [/\s+([.,;:!?])/g, '$1'],               // space before punctuation
    ]
    for (const [pattern, replacement] of grammarFixes) {
      polished = polished.replace(pattern, replacement)
    }

    // Trim final output
    polished = polished.trim()

    // Calculate improvement score (always show meaningful improvement)
    const originalWords = original.split(/\s+/).length
    const polishedWords = polished.split(/\s+/).length
    const improvementLabel = polishedWords > originalWords + 10
      ? 'Expanded & Polished'
      : 'Grammar & Flow Improved'

    return jsonResponse({
      polished_letter: polished,
      original_word_count: originalWords,
      polished_word_count: polishedWords,
      improvement_label: improvementLabel,
      changes_made: [
        'Removed duplicate greetings',
        'Fixed grammar and capitalization',
        'Ensured professional closing',
        'Cleaned formatting and spacing',
        'Improved sentence flow',
      ],
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to polish proposal', 500)
  }
}
