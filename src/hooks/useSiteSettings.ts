'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface SiteSettings {
  platform_name: string
  platform_tagline: string
  service_fee_percent: number
  tax_rate_percent: number
  min_withdrawal: number
  min_escrow: number
  promo_banner_enabled: boolean
  promo_banner_text: string
  promo_code: string
  maintenance_mode: boolean
  signup_enabled: boolean
  max_proposal_per_job: number
  max_jobs_per_user: number
  contact_email: string
  social_twitter: string
  social_linkedin: string
  social_facebook: string
  social_links: Array<{ name: string; url: string; icon: string; order_index: number }>
  [key: string]: any
}

interface DatabaseSetting {
  key: string
  value: string
}

const defaultSettings: SiteSettings = {
  platform_name: 'HustleKe',
  platform_tagline: 'Connect with global clients. Get paid instantly via M-Pesa.',
  service_fee_percent: 5,
  tax_rate_percent: 16,
  min_withdrawal: 50,
  min_escrow: 100,
  promo_banner_enabled: true,
  promo_banner_text: 'Get 50% off service fees — Limited Time',
  promo_code: 'HUSTLE50',
  maintenance_mode: false,
  signup_enabled: true,
  max_proposal_per_job: 50,
  max_jobs_per_user: 20,
  contact_email: 'support@hustleke.co.ke',
  social_twitter: 'https://twitter.com/hustleke',
  social_linkedin: 'https://linkedin.com/company/hustleke',
  social_facebook: 'https://facebook.com/hustleke',
  social_links: []
}

/**
 * Fetches site settings from site_settings table.
 * Merges with defaults so app works even if DB is empty.
 */
export function useSiteSettings(): SiteSettings & { refresh: () => void } {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)

  const fetchSettings = async () => {
    const supabase = createClient()
    
    // Fetch site settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value')
    
    // Fetch social links
    const socialResponse = await fetch('/api/social-links')
    const socialData = socialResponse.ok ? await socialResponse.json() : { social_links: [] }
    
    // Debug logging
    console.log('useSiteSettings Debug:', {
      settingsError: settingsError?.message,
      settingsCount: settingsData?.length || 0,
      socialResponseOk: socialResponse.ok,
      socialLinksCount: socialData.social_links?.length || 0,
      socialLinks: socialData.social_links
    })
    
    if (!settingsError && settingsData) {
      const merged = { ...defaultSettings }
      settingsData.forEach((setting: DatabaseSetting) => {
        if (setting.key in merged) {
          // Parse JSON value and assign
          try {
            const parsedValue = JSON.parse(setting.value)
            merged[setting.key] = parsedValue
          } catch (e) {
            console.warn(`Failed to parse setting ${setting.key}:`, setting.value)
            // If parsing fails, use the raw value
            merged[setting.key] = setting.value
          }
        }
      })
      
      // Add social links
      merged.social_links = socialData.social_links || []
      
      console.log('Final merged settings social_links:', merged.social_links)
      setSettings(merged)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return { ...settings, refresh: fetchSettings }
}
