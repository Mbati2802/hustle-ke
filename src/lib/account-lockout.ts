/**
 * Account Lockout Utility
 * Prevents brute force attacks by locking accounts after failed login attempts
 */

interface LoginAttempt {
  count: number
  lastAttempt: number
  lockedUntil?: number
}

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes window to track attempts

// In-memory store (in production, use Redis or database)
const loginAttempts = new Map<string, LoginAttempt>()

export function recordFailedLogin(identifier: string): { locked: boolean; remainingAttempts: number; lockedUntil?: Date } {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)

  if (!attempt) {
    // First failed attempt
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
    })
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  // Check if account is currently locked
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: new Date(attempt.lockedUntil),
    }
  }

  // Reset count if last attempt was outside the window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now,
    })
    return { locked: false, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  // Increment attempt count
  const newCount = attempt.count + 1

  if (newCount >= MAX_ATTEMPTS) {
    // Lock the account
    const lockedUntil = now + LOCKOUT_DURATION
    loginAttempts.set(identifier, {
      count: newCount,
      lastAttempt: now,
      lockedUntil,
    })
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntil: new Date(lockedUntil),
    }
  }

  // Update attempt count
  loginAttempts.set(identifier, {
    count: newCount,
    lastAttempt: now,
  })

  return {
    locked: false,
    remainingAttempts: MAX_ATTEMPTS - newCount,
  }
}

export function recordSuccessfulLogin(identifier: string): void {
  // Clear failed attempts on successful login
  loginAttempts.delete(identifier)
}

export function isAccountLocked(identifier: string): { locked: boolean; lockedUntil?: Date } {
  const attempt = loginAttempts.get(identifier)
  if (!attempt || !attempt.lockedUntil) {
    return { locked: false }
  }

  const now = Date.now()
  if (attempt.lockedUntil > now) {
    return {
      locked: true,
      lockedUntil: new Date(attempt.lockedUntil),
    }
  }

  // Lockout period has expired
  loginAttempts.delete(identifier)
  return { locked: false }
}

export function getRemainingAttempts(identifier: string): number {
  const attempt = loginAttempts.get(identifier)
  if (!attempt) return MAX_ATTEMPTS

  const now = Date.now()
  
  // Check if locked
  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    return 0
  }

  // Check if attempts are outside the window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    return MAX_ATTEMPTS
  }

  return Math.max(0, MAX_ATTEMPTS - attempt.count)
}

// Cleanup old entries periodically (run this in a background job)
export function cleanupOldAttempts(): void {
  const now = Date.now()
  const entries = Array.from(loginAttempts.entries())
  for (const [identifier, attempt] of entries) {
    // Remove entries older than the attempt window and not locked
    if (!attempt.lockedUntil && now - attempt.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(identifier)
    }
    // Remove expired lockouts
    if (attempt.lockedUntil && attempt.lockedUntil < now) {
      loginAttempts.delete(identifier)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupOldAttempts, 5 * 60 * 1000)
}
