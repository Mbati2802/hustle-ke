import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { validate, forgotPasswordSchema } from '@/lib/validation'
import { jsonResponse, errorResponse, validationErrorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{ email: string }>(body, forgotPasswordSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${appUrl}/api/auth/callback?next=/reset-password`,
  })

  // Always return success to prevent email enumeration
  return jsonResponse({ message: 'If an account exists with that email, a password reset link has been sent.' })
}
