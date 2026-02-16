import { NextRequest } from 'next/server'
import { jsonResponse, errorResponse, createPublicRouteClient } from '@/lib/api-utils'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// GET /api/profile/[id] — Get public profile by profile ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error: rlError, supabase } = createPublicRouteClient(req)
  if (rlError) return rlError

  const { data: profile, error } = await supabase!
    .from('profiles')
    .select('id, full_name, avatar_url, bio, title, skills, hourly_rate, location, county, verification_status, hustle_score, jobs_completed, total_earned, languages, swahili_speaking, created_at, years_experience, availability, available_from, education, certifications')
    .eq('id', params.id)
    .single()

  if (error || !profile) {
    return errorResponse('Profile not found', 404)
  }

  // Check if user has active Pro subscription (use service role to bypass RLS)
  const adminDb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data: subscription } = await adminDb
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', params.id)
    .eq('status', 'active')
    .single()

  const is_pro = subscription?.plan === 'pro' || subscription?.plan === 'enterprise'

  // Fetch portfolio with images
  const { data: categories } = await supabase!
    .from('portfolio_categories')
    .select('id, name, description, sort_order')
    .eq('user_id', params.id)
    .order('sort_order', { ascending: true })

  const { data: items } = await supabase!
    .from('portfolio_items')
    .select('id, title, description, client_name, project_url, category_id, tags, is_featured, images:portfolio_images(id, url, alt_text, is_cover, sort_order)')
    .eq('user_id', params.id)
    .order('sort_order', { ascending: true })

  const portfolio = (categories || []).map(cat => ({
    ...cat,
    items: (items || []).filter((item: Record<string, unknown>) => item.category_id === cat.id),
  }))

  const uncategorized = (items || []).filter((item: Record<string, unknown>) => !item.category_id)
  if (uncategorized.length > 0) {
    portfolio.push({ id: 'uncategorized', name: 'Other Work', description: null, sort_order: 999, items: uncategorized })
  }

  return jsonResponse({ profile: { ...profile, is_pro, portfolio } })
}
