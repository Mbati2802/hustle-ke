import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  // Build the Supabase project ref from the URL to match cookie names
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || ''

  const supabase = createSupabaseServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  // Attempt server-side signOut (revokes refresh token on Supabase)
  try { await supabase.auth.signOut() } catch {}

  // Build response and explicitly clear ALL auth cookies
  const response = NextResponse.json(
    { message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    }
  )

  // Clear all possible Supabase auth cookie names
  const cookieNames = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token.0`,
    `sb-${projectRef}-auth-token.1`,
    'sb-access-token',
    'sb-refresh-token',
    'csrf-token',
  ]

  // Also clear any cookie from the request that looks like a Supabase auth cookie
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && !cookieNames.includes(cookie.name)) {
      cookieNames.push(cookie.name)
    }
  }

  for (const name of cookieNames) {
    response.cookies.set(name, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0,
      httpOnly: name !== 'csrf-token',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  return response
}
