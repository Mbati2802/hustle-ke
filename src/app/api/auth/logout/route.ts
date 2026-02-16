import { NextRequest } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { jsonResponse, errorResponse } from '@/lib/api-utils'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
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

  const { error } = await supabase.auth.signOut()

  if (error) {
    return errorResponse('Failed to log out', 500)
  }

  return jsonResponse({ message: 'Logged out successfully' })
}
