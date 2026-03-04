import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  // Check if social_links table exists and has data
  const { data: socialLinks, error: socialError } = await supabase
    .from('social_links')
    .select('*')
    .order('order_index')
  
  // Check site_settings for old social links
  const { data: siteSettings, error: settingsError } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['social_twitter', 'social_linkedin', 'social_facebook'])
  
  return new Response(JSON.stringify({ 
    social_links: {
      data: socialLinks,
      error: socialError?.message || null,
      count: socialLinks?.length || 0
    },
    site_settings_social: {
      data: siteSettings,
      error: settingsError?.message || null,
      count: siteSettings?.length || 0
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
