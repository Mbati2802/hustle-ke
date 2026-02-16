import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { validate, loginSchema } from '@/lib/validation'
import { jsonResponse, errorResponse, validationErrorResponse, checkAuthRateLimit, parseBody } from '@/lib/api-utils'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const rateLimited = checkAuthRateLimit(req)
  if (rateLimited) return rateLimited

  const body = await parseBody(req)
  if (!body) return errorResponse('Invalid request body')

  const result = validate<{ email: string; password: string }>(body, loginSchema)
  if (!result.success) return validationErrorResponse(result.errors)

  const { email, password } = result.data

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
    return errorResponse('Invalid email or password', 401)
  }

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
