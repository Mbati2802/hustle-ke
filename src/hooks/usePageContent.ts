'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContentMap = Record<string, any>

/**
 * Fetches page content from site_pages table by slug.
 * Merges DB content with provided defaults so pages work even if DB is empty.
 * 
 * Usage:
 *   const content = usePageContent('about', { hero_title: 'Default Title', ... })
 *   // content.hero_title will be from DB if available, otherwise 'Default Title'
 */
export function usePageContent<T extends ContentMap>(slug: string, defaults: T): T {
  const [content, setContent] = useState<T>(defaults)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('site_pages')
      .select('content')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
      .then(({ data }: { data: { content: unknown } | null }) => {
        if (data?.content && typeof data.content === 'object') {
          setContent((prev) => {
            const merged = { ...prev } as Record<string, unknown>
            for (const [key, dbVal] of Object.entries(data.content as Record<string, unknown>)) {
              const defVal = prev[key]
              // Preserve type safety: arrays must stay arrays, objects must stay objects
              if (Array.isArray(defVal)) {
                if (Array.isArray(dbVal)) {
                  // Extra guard: if default items are objects, DB items must also be objects
                  const defHasObjects = defVal.length > 0 && typeof defVal[0] === 'object'
                  const dbHasObjects = dbVal.length > 0 && typeof dbVal[0] === 'object'
                  if (!defHasObjects || dbHasObjects || dbVal.length === 0) {
                    merged[key] = dbVal
                  }
                }
                // else: keep default array
              } else if (defVal !== null && typeof defVal === 'object' && !Array.isArray(defVal)) {
                if (dbVal !== null && typeof dbVal === 'object' && !Array.isArray(dbVal)) merged[key] = dbVal
                // else: keep default object
              } else {
                merged[key] = dbVal
              }
            }
            return merged as T
          })
        }
      })
  }, [slug])

  return content
}
