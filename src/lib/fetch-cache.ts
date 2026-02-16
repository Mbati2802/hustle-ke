/**
 * Lightweight client-side fetch cache (SWR-like).
 * Caches API responses in memory so revisiting a dashboard page
 * shows stale data instantly while refreshing in the background.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// Default stale time: 30 seconds — show cached data but still refetch
const DEFAULT_STALE_MS = 30_000

/**
 * Fetch with cache. Returns cached data immediately if available,
 * then refetches in background and calls onUpdate with fresh data.
 *
 * @param url - API URL to fetch
 * @param onUpdate - Called with fresh data when refetch completes
 * @param staleMs - How long cached data is considered fresh (skip refetch)
 * @returns Cached data if available, or null
 */
export function cachedFetch<T>(
  url: string,
  onUpdate: (data: T) => void,
  staleMs = DEFAULT_STALE_MS
): T | null {
  const entry = cache.get(url) as CacheEntry<T> | undefined
  const now = Date.now()

  // If cache is fresh enough, return it and skip refetch
  if (entry && now - entry.timestamp < staleMs) {
    return entry.data
  }

  // Refetch in background
  fetch(url)
    .then(r => r.json())
    .then((data: T) => {
      cache.set(url, { data, timestamp: Date.now() })
      onUpdate(data)
    })
    .catch(() => {})

  // Return stale data if we have it (better than blank)
  return entry?.data ?? null
}

/**
 * Invalidate a specific cache entry (e.g. after mutation)
 */
export function invalidateCache(url: string) {
  cache.delete(url)
}

/**
 * Invalidate all cache entries matching a prefix
 */
export function invalidateCachePrefix(prefix: string) {
  Array.from(cache.keys()).forEach(key => {
    if (key.startsWith(prefix)) cache.delete(key)
  })
}

/**
 * React hook-style fetch with cache.
 * Returns { data, loading } and handles the lifecycle.
 */
export async function fetchWithCache<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json() as T
  cache.set(url, { data, timestamp: Date.now() })
  return data
}
