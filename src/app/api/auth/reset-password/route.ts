import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { validate, resetPasswordSchema } from '@/lib/validation'
import { jsonResponse, errorResponse, validationErrorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{ password: string }>(body, resetPasswordSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.updateUser({ password: result.data.password })

  if (error) {
    return errorResponse('Failed to reset password. The link may have expired.', 400)
  }

  return jsonResponse({ message: 'Password updated successfully' })
}
