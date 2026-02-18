/**
 * Field-Level Encryption for Sensitive Data
 * 
 * Uses AES-256-GCM for authenticated encryption with additional data (AEAD).
 * Protects sensitive financial and personal information at rest.
 * 
 * IMPORTANT: Set ENCRYPTION_KEY environment variable (32-byte hex string)
 * Generate with: openssl rand -hex 32
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Get encryption key from environment
 * Falls back to a default key in development (NOT FOR PRODUCTION)
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  
  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable must be set in production')
    }
    
    // Development fallback (NOT SECURE - for testing only)
    console.warn('⚠️  Using default encryption key. Set ENCRYPTION_KEY in production!')
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex')
  }
  
  const key = Buffer.from(keyHex, 'hex')
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`)
  }
  
  return key
}

/**
 * Encrypt sensitive data
 * Returns: iv:encrypted:tag (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Format: iv:encrypted:tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 * Input format: iv:encrypted:tag (all hex-encoded)
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ''
  
  try {
    const key = getEncryptionKey()
    const parts = ciphertext.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format')
    }
    
    const [ivHex, encryptedHex, tagHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encryptedHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt M-Pesa phone number
 */
export function encryptPhone(phone: string): string {
  if (!phone) return ''
  return encrypt(phone)
}

/**
 * Decrypt M-Pesa phone number
 */
export function decryptPhone(encryptedPhone: string): string {
  if (!encryptedPhone) return ''
  return decrypt(encryptedPhone)
}

/**
 * Mask phone number for display (show last 4 digits only)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****'
  return `****${phone.slice(-4)}`
}

/**
 * Encrypt wallet balance
 */
export function encryptAmount(amount: number): string {
  return encrypt(amount.toString())
}

/**
 * Decrypt wallet balance
 */
export function decryptAmount(encryptedAmount: string): number {
  const decrypted = decrypt(encryptedAmount)
  return parseFloat(decrypted)
}

/**
 * Hash sensitive data for indexing/searching
 * Uses SHA-256 for deterministic hashing
 */
export function hashForIndex(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Check if data is encrypted (has correct format)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false
  const parts = data.split(':')
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p))
}

/**
 * Migrate plaintext data to encrypted format
 * Use this for one-time migration of existing data
 */
export function migrateToEncrypted(plaintext: string | null): string | null {
  if (!plaintext) return null
  if (isEncrypted(plaintext)) return plaintext // Already encrypted
  return encrypt(plaintext)
}

/**
 * Safely get decrypted value with fallback
 */
export function safeDecrypt(ciphertext: string | null, fallback = ''): string {
  if (!ciphertext) return fallback
  
  try {
    if (isEncrypted(ciphertext)) {
      return decrypt(ciphertext)
    }
    // If not encrypted, return as-is (for backward compatibility during migration)
    return ciphertext
  } catch (error) {
    console.error('Safe decrypt failed:', error)
    return fallback
  }
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
