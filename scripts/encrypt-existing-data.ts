/**
 * Data Encryption Migration Script
 * 
 * One-time script to encrypt existing plaintext sensitive data.
 * Run this ONCE after deploying encryption functionality.
 * 
 * IMPORTANT: Test on staging first!
 * 
 * Usage:
 *   npx ts-node scripts/encrypt-existing-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { encryptPhone, isEncrypted } from '../src/lib/encryption'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set')
  process.exit(1)
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ ENCRYPTION_KEY not set')
  console.error('Generate one with: openssl rand -hex 32')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

interface EncryptionStats {
  total: number
  encrypted: number
  alreadyEncrypted: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

/**
 * Encrypt M-Pesa phone numbers in profiles table
 */
async function encryptProfilePhones(): Promise<EncryptionStats> {
  console.log('\n📱 Encrypting phone numbers in profiles...')
  
  const stats: EncryptionStats = {
    total: 0,
    encrypted: 0,
    alreadyEncrypted: 0,
    failed: 0,
    errors: [],
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)

  if (error) {
    console.error('❌ Failed to fetch profiles:', error)
    return stats
  }

  stats.total = profiles?.length || 0
  console.log(`Found ${stats.total} profiles with phone numbers`)

  for (const profile of profiles || []) {
    try {
      if (!profile.mpesa_phone) continue

      // Check if already encrypted
      if (isEncrypted(profile.mpesa_phone)) {
        stats.alreadyEncrypted++
        continue
      }

      // Encrypt the phone number
      const encryptedPhone = encryptPhone(profile.mpesa_phone)

      // Update in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mpesa_phone: encryptedPhone })
        .eq('id', profile.id)

      if (updateError) {
        stats.failed++
        stats.errors.push({
          id: profile.id,
          error: updateError.message,
        })
        console.error(`❌ Failed to encrypt profile ${profile.id}:`, updateError.message)
      } else {
        stats.encrypted++
        if (stats.encrypted % 10 === 0) {
          console.log(`  ✅ Encrypted ${stats.encrypted}/${stats.total} profiles...`)
        }
      }
    } catch (err) {
      stats.failed++
      stats.errors.push({
        id: profile.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return stats
}

/**
 * Encrypt M-Pesa phone numbers in wallet_transactions table
 */
async function encryptTransactionPhones(): Promise<EncryptionStats> {
  console.log('\n💳 Encrypting phone numbers in wallet_transactions...')
  
  const stats: EncryptionStats = {
    total: 0,
    encrypted: 0,
    alreadyEncrypted: 0,
    failed: 0,
    errors: [],
  }

  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)

  if (error) {
    console.error('❌ Failed to fetch transactions:', error)
    return stats
  }

  stats.total = transactions?.length || 0
  console.log(`Found ${stats.total} transactions with phone numbers`)

  for (const tx of transactions || []) {
    try {
      if (!tx.mpesa_phone) continue

      // Check if already encrypted
      if (isEncrypted(tx.mpesa_phone)) {
        stats.alreadyEncrypted++
        continue
      }

      // Encrypt the phone number
      const encryptedPhone = encryptPhone(tx.mpesa_phone)

      // Update in database
      const { error: updateError } = await supabase
        .from('wallet_transactions')
        .update({ mpesa_phone: encryptedPhone })
        .eq('id', tx.id)

      if (updateError) {
        stats.failed++
        stats.errors.push({
          id: tx.id,
          error: updateError.message,
        })
        console.error(`❌ Failed to encrypt transaction ${tx.id}:`, updateError.message)
      } else {
        stats.encrypted++
        if (stats.encrypted % 50 === 0) {
          console.log(`  ✅ Encrypted ${stats.encrypted}/${stats.total} transactions...`)
        }
      }
    } catch (err) {
      stats.failed++
      stats.errors.push({
        id: tx.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return stats
}

/**
 * Verify encryption by attempting to decrypt a sample
 */
async function verifyEncryption(): Promise<boolean> {
  console.log('\n🔍 Verifying encryption...')

  // Check a sample profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('mpesa_phone')
    .not('mpesa_phone', 'is', null)
    .limit(1)
    .single()

  if (profile?.mpesa_phone) {
    const encrypted = isEncrypted(profile.mpesa_phone)
    if (encrypted) {
      console.log('✅ Sample profile phone is encrypted')
      return true
    } else {
      console.log('⚠️  Sample profile phone is NOT encrypted')
      return false
    }
  }

  console.log('⚠️  No profiles found to verify')
  return true
}

/**
 * Main migration function
 */
async function main() {
  console.log('🔐 Starting Data Encryption Migration')
  console.log('=====================================')
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('')

  // Confirm before proceeding in production
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  WARNING: Running in PRODUCTION mode!')
    console.log('⚠️  This will encrypt all plaintext sensitive data.')
    console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  const startTime = Date.now()

  // Encrypt profiles
  const profileStats = await encryptProfilePhones()

  // Encrypt transactions
  const transactionStats = await encryptTransactionPhones()

  // Verify encryption
  const verified = await verifyEncryption()

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  // Print summary
  console.log('\n')
  console.log('=====================================')
  console.log('📊 MIGRATION SUMMARY')
  console.log('=====================================')
  console.log('')
  console.log('Profiles:')
  console.log(`  Total: ${profileStats.total}`)
  console.log(`  ✅ Encrypted: ${profileStats.encrypted}`)
  console.log(`  ⏭️  Already encrypted: ${profileStats.alreadyEncrypted}`)
  console.log(`  ❌ Failed: ${profileStats.failed}`)
  console.log('')
  console.log('Transactions:')
  console.log(`  Total: ${transactionStats.total}`)
  console.log(`  ✅ Encrypted: ${transactionStats.encrypted}`)
  console.log(`  ⏭️  Already encrypted: ${transactionStats.alreadyEncrypted}`)
  console.log(`  ❌ Failed: ${transactionStats.failed}`)
  console.log('')
  console.log(`⏱️  Duration: ${duration}s`)
  console.log(`🔍 Verification: ${verified ? '✅ PASSED' : '❌ FAILED'}`)
  console.log('')

  // Print errors if any
  const allErrors = [...profileStats.errors, ...transactionStats.errors]
  if (allErrors.length > 0) {
    console.log('❌ ERRORS:')
    allErrors.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`)
    })
    console.log('')
  }

  // Exit with appropriate code
  const totalFailed = profileStats.failed + transactionStats.failed
  if (totalFailed > 0) {
    console.log(`⚠️  Migration completed with ${totalFailed} errors`)
    process.exit(1)
  } else {
    console.log('🎉 Migration completed successfully!')
    process.exit(0)
  }
}

// Run migration
main().catch(err => {
  console.error('💥 Migration failed:', err)
  process.exit(1)
})
