// Hybrid rate limiter: in-memory (fast) + optional DB persistence (survives deploys)

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key)
    })
  }, 5 * 60 * 1000)
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }

  entry.count++
  const remaining = Math.max(0, config.maxRequests - entry.count)

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining, resetAt: entry.resetAt }
}

// DB-backed rate limiter for critical paths (auth, payments)
// Uses rate_limits table — persists across server restarts/deploys
export async function rateLimitPersistent(
  supabase: any,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = identifier
  const now = new Date()

  // Try to get existing entry
  const { data: entry } = await supabase
    .from('rate_limits')
    .select('count, window_start, window_ms, max_requests')
    .eq('id', key)
    .single()

  if (!entry || new Date(entry.window_start).getTime() + entry.window_ms < now.getTime()) {
    // No entry or window expired — create/reset
    await supabase
      .from('rate_limits')
      .upsert({
        id: key,
        count: 1,
        window_start: now.toISOString(),
        window_ms: config.windowMs,
        max_requests: config.maxRequests,
      })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now.getTime() + config.windowMs }
  }

  // Increment count
  const newCount = entry.count + 1
  await supabase
    .from('rate_limits')
    .update({ count: newCount })
    .eq('id', key)

  const resetAt = new Date(entry.window_start).getTime() + entry.window_ms
  const remaining = Math.max(0, config.maxRequests - newCount)

  if (newCount > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt }
  }

  return { allowed: true, remaining, resetAt }
}

// Preset configs
export const RATE_LIMITS = {
  auth: process.env.NODE_ENV === 'development' 
    ? { maxRequests: 30, windowMs: 15 * 60 * 1000 }        // 30 per 15 min in dev
    : { maxRequests: 5, windowMs: 15 * 60 * 1000 },        // 5 per 15 min in production
  api: { maxRequests: 60, windowMs: 60 * 1000 },            // 60 per min
  search: { maxRequests: 30, windowMs: 60 * 1000 },         // 30 per min
  upload: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 per min
  message: { maxRequests: 30, windowMs: 60 * 1000 },        // 30 per min
  admin: { maxRequests: 120, windowMs: 60 * 1000 },         // 120 per min
} as const
