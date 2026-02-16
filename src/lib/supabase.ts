import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client — singleton to avoid Web Locks AbortError during HMR
let browserClient: ReturnType<typeof createBrowserClient> | null = null
export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey)
  }
  return browserClient
}

// Server-side Supabase client (for use in server components/API routes)
export function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Admin/Service role client (for server-only operations)
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
