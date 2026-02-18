/**
 * Idempotency Key Management
 * 
 * Prevents duplicate processing of payment operations.
 * Implements idempotency using unique request keys.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const IDEMPOTENCY_HEADER = 'idempotency-key'
const IDEMPOTENCY_EXPIRY_HOURS = 24

/**
 * Check if request has already been processed
 * Returns cached response if found
 */
export async function checkIdempotency(
  req: NextRequest,
  supabase: SupabaseClient,
  userId: string
): Promise<NextResponse | null> {
  const idempotencyKey = req.headers.get(IDEMPOTENCY_HEADER)
  
  if (!idempotencyKey) {
    return null // No idempotency key provided
  }
  
  // Validate key format (must be UUID or similar)
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(idempotencyKey)) {
    return NextResponse.json(
      { error: 'Invalid idempotency key format. Use UUID or similar unique identifier.' },
      { status: 400 }
    )
  }
  
  // Check if this request was already processed
  const { data: existing } = await supabase
    .from('idempotency_log')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId)
    .single()
  
  if (existing) {
    // Request already processed, return cached response
    return NextResponse.json(
      existing.response_body,
      { 
        status: existing.response_status,
        headers: {
          'X-Idempotency-Replay': 'true',
        }
      }
    )
  }
  
  return null // Request not yet processed
}

/**
 * Store response for idempotency
 */
export async function storeIdempotencyResponse(
  supabase: SupabaseClient,
  idempotencyKey: string,
  userId: string,
  requestPath: string,
  requestMethod: string,
  responseStatus: number,
  responseBody: unknown
): Promise<void> {
  try {
    await supabase.from('idempotency_log').insert({
      idempotency_key: idempotencyKey,
      user_id: userId,
      request_path: requestPath,
      request_method: requestMethod,
      response_status: responseStatus,
      response_body: responseBody,
      expires_at: new Date(Date.now() + IDEMPOTENCY_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to store idempotency log:', error)
  }
}

/**
 * Middleware helper for idempotent operations
 */
export async function withIdempotency<T = any>(
  req: NextRequest,
  supabase: SupabaseClient,
  userId: string,
  handler: () => Promise<{ status: number; body: T }>
): Promise<NextResponse> {
  // Check if already processed
  const cached = await checkIdempotency(req, supabase, userId)
  if (cached) {
    return cached
  }
  
  // Process request
  const result = await handler()
  
  // Store for future idempotency checks
  const idempotencyKey = req.headers.get(IDEMPOTENCY_HEADER)
  if (idempotencyKey) {
    const pathname = new URL(req.url).pathname
    await storeIdempotencyResponse(
      supabase,
      idempotencyKey,
      userId,
      pathname,
      req.method,
      result.status,
      result.body
    )
  }
  
  return NextResponse.json(result.body, { status: result.status })
}

/**
 * Generate idempotency key (client-side helper)
 */
export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
