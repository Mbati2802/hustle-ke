/**
 * reCAPTCHA v3 Verification Utility
 * Server-side verification of reCAPTCHA tokens
 */

interface RecaptchaResponse {
  success: boolean
  score: number
  action: string
  challenge_ts: string
  hostname: string
  'error-codes'?: string[]
}

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

// Minimum score threshold (0.0 - 1.0, where 1.0 is very likely human)
const MIN_SCORE = 0.5

export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<{
  success: boolean
  score?: number
  error?: string
}> {
  // If no secret key configured, skip verification (development mode)
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn('[reCAPTCHA] No secret key configured - skipping verification')
    return { success: true, score: 1.0 }
  }

  if (!token) {
    return { success: false, error: 'reCAPTCHA token is required' }
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    })

    const data: RecaptchaResponse = await response.json()

    if (!data.success) {
      console.error('[reCAPTCHA] Verification failed:', data['error-codes'])
      return {
        success: false,
        error: 'reCAPTCHA verification failed',
      }
    }

    // Check score (v3 returns a score between 0.0 and 1.0)
    if (data.score < MIN_SCORE) {
      console.warn('[reCAPTCHA] Low score:', data.score)
      return {
        success: false,
        score: data.score,
        error: 'Suspicious activity detected. Please try again.',
      }
    }

    // Verify action matches (optional)
    if (expectedAction && data.action !== expectedAction) {
      console.warn('[reCAPTCHA] Action mismatch:', data.action, 'expected:', expectedAction)
      return {
        success: false,
        error: 'Invalid reCAPTCHA action',
      }
    }

    return {
      success: true,
      score: data.score,
    }
  } catch (error) {
    console.error('[reCAPTCHA] Verification error:', error)
    return {
      success: false,
      error: 'reCAPTCHA verification failed',
    }
  }
}

// Helper to check if reCAPTCHA is enabled
export function isRecaptchaEnabled(): boolean {
  return !!RECAPTCHA_SECRET_KEY
}
