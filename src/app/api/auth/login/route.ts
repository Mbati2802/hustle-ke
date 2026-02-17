import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { validate, loginSchema } from '@/lib/validation'
import { jsonResponse, errorResponse, validationErrorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'
import { cookies } from 'next/headers'
import { isAccountLocked, recordFailedLogin, recordSuccessfulLogin } from '@/lib/account-lockout'
import { verifyRecaptcha } from '@/lib/recaptcha'

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  // Verify reCAPTCHA if token provided
  const recaptchaToken = (body as { recaptchaToken?: string }).recaptchaToken
  if (recaptchaToken) {
    const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'login')
    if (!recaptchaResult.success) {
      return errorResponse(recaptchaResult.error || 'reCAPTCHA verification failed', 400)
    }
  }

  const result = validate<{ email: string; password: string }>(body, loginSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  const { email, password } = result.data

  // Check if account is locked
  const lockStatus = isAccountLocked(email)
  if (lockStatus.locked && lockStatus.lockedUntil) {
    const minutesRemaining = Math.ceil((lockStatus.lockedUntil.getTime() - Date.now()) / 60000)
    return errorResponse(
      `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
      429
    )
  }

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Record failed login attempt
    const lockoutResult = recordFailedLogin(email)
    
    if (lockoutResult.locked && lockoutResult.lockedUntil) {
      const minutesRemaining = Math.ceil((lockoutResult.lockedUntil.getTime() - Date.now()) / 60000)
      return errorResponse(
        `Too many failed login attempts. Account locked for ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
        429
      )
    }
    
    const message = lockoutResult.remainingAttempts > 0
      ? `Invalid email or password. ${lockoutResult.remainingAttempts} attempt${lockoutResult.remainingAttempts !== 1 ? 's' : ''} remaining.`
      : 'Invalid email or password'
    
    return errorResponse(message, 401)
  }

  // Record successful login (clears failed attempts)
  recordSuccessfulLogin(email)

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .eq('user_id', data.user.id)
    .single()

  return jsonResponse({
    message: 'Logged in successfully',
    user: {
      id: data.user.id,
      email: data.user.email,
      profile,
    },
  })
}
