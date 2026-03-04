import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key')
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Parse values for display
  const parsedSettings = settings?.map(setting => ({
    ...setting,
    parsed_value: (() => {
      try {
        return JSON.parse(setting.value)
      } catch {
        return setting.value
      }
    })()
  }))
  
  return new Response(JSON.stringify({ 
    settings: parsedSettings,
    count: parsedSettings?.length 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
