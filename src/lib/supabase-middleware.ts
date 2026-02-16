import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createMiddlewareClient(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: new Headers(req.headers) } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set(name, value)
          res = NextResponse.next({ request: { headers: new Headers(req.headers) } })
          res.cookies.set(name, value, options as Record<string, unknown>)
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set(name, '')
          res = NextResponse.next({ request: { headers: new Headers(req.headers) } })
          res.cookies.set(name, '', options as Record<string, unknown>)
        },
      },
    }
  )

  return { supabase, res }
}
