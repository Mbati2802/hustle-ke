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
  
  // Simulate what useSiteSettings would do
  const merged = {}
  const socialTwitterSetting = parsedSettings.find(s => s.key === 'social_twitter')
  const socialLinkedinSetting = parsedSettings.find(s => s.key === 'social_linkedin') 
  const socialFacebookSetting = parsedSettings.find(s => s.key === 'social_facebook')
  const socialLinksSetting = parsedSettings.find(s => s.key === 'social_links')
  
  if (socialTwitterSetting) merged.social_twitter = socialTwitterSetting.parsed_value
  if (socialLinkedinSetting) merged.social_linkedin = socialLinkedinSetting.parsed_value
  if (socialFacebookSetting) merged.social_facebook = socialFacebookSetting.parsed_value
  if (socialLinksSetting) merged.social_links = socialLinksSetting.parsed_value
  
  // Show what social_links would be after fallback logic
  let finalSocialLinks = merged.social_links
  if (!Array.isArray(finalSocialLinks) || finalSocialLinks.length === 0) {
    finalSocialLinks = [
      { name: 'Twitter', url: merged.social_twitter, icon: 'Twitter', order_index: 1 },
      { name: 'LinkedIn', url: merged.social_linkedin, icon: 'Linkedin', order_index: 2 },
      { name: 'Facebook', url: merged.social_facebook, icon: 'Facebook', order_index: 3 }
    ].filter(link => typeof link.url === 'string' && link.url.trim() !== '')
  }
  
  return new Response(JSON.stringify({ 
    settings: parsedSettings,
    count: parsedSettings?.length,
    merged_values: merged,
    final_social_links: finalSocialLinks
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
