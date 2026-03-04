import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET /api/social-links — Get active social links for public display
export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  const { data: links, error } = await supabase
    .from('social_links')
    .select('name, url, icon, order_index')
    .eq('is_active', true)
    .order('order_index')
  
  if (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch social links' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  return new Response(JSON.stringify({ 
    social_links: links || []
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
