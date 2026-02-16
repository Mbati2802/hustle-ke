// In-memory rate limiter for API routes
// For production at scale, swap with Redis-backed solution

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

// Preset configs
export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },      // 5 per 15 min
  api: { maxRequests: 60, windowMs: 60 * 1000 },            // 60 per min
  search: { maxRequests: 30, windowMs: 60 * 1000 },         // 30 per min
  upload: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 per min
  message: { maxRequests: 30, windowMs: 60 * 1000 },        // 30 per min
  admin: { maxRequests: 120, windowMs: 60 * 1000 },         // 120 per min
} as const
