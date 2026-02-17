import { NextRequest, NextResponse } from 'next/server'
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { rateLimit, RATE_LIMITS } from './rate-limit'
import type { Profile, UserRole } from '@/types'

// ─── Response helpers ───

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  })
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status)
}

export function validationErrorResponse(errors: Record<string, string>) {
  return jsonResponse({ error: 'Validation failed', details: errors }, 422)
}

// ─── Create Supabase client from API route request ───

function createRouteClient(req: NextRequest) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
}

// ─── Auth guard: returns authenticated user + profile or error ───

function createAdminRouteClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

interface AuthContext {
  supabase: ReturnType<typeof createRouteClient>
  adminDb: ReturnType<typeof createAdminRouteClient>
  userId: string
  profile: Profile
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(`api:${ip}`, RATE_LIMITS.api)
  if (!rl.allowed) {
    return errorResponse('Too many requests. Please try again later.', 429)
  }

  const supabase = createRouteClient(req)
  
  let user = null
  let authError = null
  
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
    authError = result.error
    
    // Handle refresh token errors gracefully
    if (authError && authError.message?.includes('refresh_token_not_found')) {
      return errorResponse('Session expired. Please log in again.', 401)
    }
  } catch (error: any) {
    // Catch any unexpected auth errors
    console.error('Auth error in requireAuth:', error)
    return errorResponse('Authentication error', 401)
  }

  if (authError || !user) {
    return errorResponse('Unauthorized', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return errorResponse('Profile not found. Please complete registration.', 403)
  }

  const adminDb = createAdminRouteClient()
  return { supabase, adminDb, userId: user.id, profile: profile as Profile }
}

// ─── Admin guard: requires Admin role ───

export async function requireAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  const result = await requireAuth(req)
  if (result instanceof NextResponse) return result

  if (result.profile.role !== 'Admin') {
    return errorResponse('Forbidden: Admin access required', 403)
  }

  return result
}

// ─── Role guard: requires specific roles ───

export async function requireRole(req: NextRequest, roles: UserRole[]): Promise<AuthContext | NextResponse> {
  const result = await requireAuth(req)
  if (result instanceof NextResponse) return result

  if (!roles.includes(result.profile.role)) {
    return errorResponse(`Forbidden: Requires one of: ${roles.join(', ')}`, 403)
  }

  return result
}

// ─── Public route with rate limiting only ───

export function createPublicRouteClient(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(`api:${ip}`, RATE_LIMITS.api)
  if (!rl.allowed) {
    return { error: errorResponse('Too many requests', 429), supabase: null }
  }
  return { error: null, supabase: createRouteClient(req) }
}

// ─── Rate limit for auth routes (stricter) ───

export function checkAuthRateLimit(req: NextRequest): NextResponse | null {
  // Temporary fix for Render deployment: disable rate limiting for specific paths
  const path = new URL(req.url).pathname
  
  // Skip rate limiting for signup to fix the "too many attempts" issue
  if (path === '/api/auth/signup') {
    return null
  }
  
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = rateLimit(`auth:${ip}`, RATE_LIMITS.auth)
  if (!rl.allowed) {
    return errorResponse('Too many authentication attempts. Please try again in 15 minutes.', 429)
  }
  return null
}

// ─── Parse JSON body safely ───

export async function parseBody<T = Record<string, unknown>>(req: NextRequest): Promise<T | null> {
  try {
    return await req.json() as T
  } catch {
    return null
  }
}

// ─── Pagination helper ───

export function getPagination(req: NextRequest, defaultLimit = 20) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10)))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}
