/**
 * Data Encryption Migration Script (Plain JS)
 * Encrypts existing plaintext phone numbers in profiles and wallet_transactions.
 * Run ONCE after deploying encryption functionality.
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load env vars from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) return
  const key = trimmed.substring(0, eqIndex).trim()
  const value = trimmed.substring(eqIndex + 1).trim()
  if (key && value) envVars[key] = value
})

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY
const ENCRYPTION_KEY = envVars.ENCRYPTION_KEY

// Validate
if (!SUPABASE_URL || !SERVICE_KEY || !ENCRYPTION_KEY) {
  console.error('❌ Missing required env vars (SUPABASE_URL, SERVICE_KEY, or ENCRYPTION_KEY)')
  process.exit(1)
}

if (ENCRYPTION_KEY.length !== 64 || !/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY)) {
  console.error('❌ ENCRYPTION_KEY must be 64 hex characters')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Encryption functions
function encryptPhone(phone) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  let encrypted = cipher.update(phone, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${encrypted}:${authTag}`
}

function isEncrypted(value) {
  if (!value) return false
  const parts = value.split(':')
  return parts.length === 3 && parts[0].length === 24 && parts[2].length === 32
}

// Step 1: Check existing data
async function checkExistingData() {
  console.log('\n🔍 CHECKING EXISTING DATA...\n')

  // Check profiles
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)

  if (pErr) {
    console.error('❌ Failed to fetch profiles:', pErr.message)
    return { profiles: [], transactions: [] }
  }

  const unencryptedProfiles = (profiles || []).filter(p => p.mpesa_phone && !isEncrypted(p.mpesa_phone))
  const encryptedProfiles = (profiles || []).filter(p => p.mpesa_phone && isEncrypted(p.mpesa_phone))

  console.log(`📱 Profiles with phone numbers: ${profiles?.length || 0}`)
  console.log(`   ✅ Already encrypted: ${encryptedProfiles.length}`)
  console.log(`   🔓 Unencrypted (need migration): ${unencryptedProfiles.length}`)

  // Check wallet_transactions
  const { data: transactions, error: tErr } = await supabase
    .from('wallet_transactions')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)

  if (tErr) {
    console.error('❌ Failed to fetch transactions:', tErr.message)
    return { profiles: unencryptedProfiles, transactions: [] }
  }

  const unencryptedTx = (transactions || []).filter(t => t.mpesa_phone && !isEncrypted(t.mpesa_phone))
  const encryptedTx = (transactions || []).filter(t => t.mpesa_phone && isEncrypted(t.mpesa_phone))

  console.log(`\n💳 Transactions with phone numbers: ${transactions?.length || 0}`)
  console.log(`   ✅ Already encrypted: ${encryptedTx.length}`)
  console.log(`   🔓 Unencrypted (need migration): ${unencryptedTx.length}`)

  return { profiles: unencryptedProfiles, transactions: unencryptedTx }
}

// Step 2: Encrypt data
async function encryptData(unencryptedProfiles, unencryptedTransactions) {
  let profilesEncrypted = 0
  let profilesFailed = 0
  let txEncrypted = 0
  let txFailed = 0

  // Encrypt profiles
  if (unencryptedProfiles.length > 0) {
    console.log(`\n📱 Encrypting ${unencryptedProfiles.length} profile phone numbers...`)
    
    for (const profile of unencryptedProfiles) {
      try {
        const encrypted = encryptPhone(profile.mpesa_phone)
        const { error } = await supabase
          .from('profiles')
          .update({ mpesa_phone: encrypted })
          .eq('id', profile.id)

        if (error) {
          profilesFailed++
          console.error(`   ❌ Profile ${profile.id}: ${error.message}`)
        } else {
          profilesEncrypted++
        }
      } catch (err) {
        profilesFailed++
        console.error(`   ❌ Profile ${profile.id}: ${err.message}`)
      }
    }
    console.log(`   ✅ Encrypted: ${profilesEncrypted}, ❌ Failed: ${profilesFailed}`)
  }

  // Encrypt transactions
  if (unencryptedTransactions.length > 0) {
    console.log(`\n💳 Encrypting ${unencryptedTransactions.length} transaction phone numbers...`)
    
    for (const tx of unencryptedTransactions) {
      try {
        const encrypted = encryptPhone(tx.mpesa_phone)
        const { error } = await supabase
          .from('wallet_transactions')
          .update({ mpesa_phone: encrypted })
          .eq('id', tx.id)

        if (error) {
          txFailed++
          console.error(`   ❌ Transaction ${tx.id}: ${error.message}`)
        } else {
          txEncrypted++
          if (txEncrypted % 50 === 0) {
            console.log(`   ... ${txEncrypted}/${unencryptedTransactions.length}`)
          }
        }
      } catch (err) {
        txFailed++
        console.error(`   ❌ Transaction ${tx.id}: ${err.message}`)
      }
    }
    console.log(`   ✅ Encrypted: ${txEncrypted}, ❌ Failed: ${txFailed}`)
  }

  return { profilesEncrypted, profilesFailed, txEncrypted, txFailed }
}

// Main
async function main() {
  console.log('🔐 DATA ENCRYPTION MIGRATION')
  console.log('='.repeat(50))
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Key length: ${ENCRYPTION_KEY.length} chars ✅`)

  // Check
  const { profiles, transactions } = await checkExistingData()

  const totalToEncrypt = profiles.length + transactions.length

  if (totalToEncrypt === 0) {
    console.log('\n🎉 No unencrypted data found! Everything is already encrypted.')
    process.exit(0)
  }

  console.log(`\n⚡ Total records to encrypt: ${totalToEncrypt}`)
  console.log('Starting encryption in 3 seconds...')
  await new Promise(r => setTimeout(r, 3000))

  // Encrypt
  const results = await encryptData(profiles, transactions)

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(50))
  console.log(`Profiles encrypted:     ${results.profilesEncrypted}`)
  console.log(`Profiles failed:        ${results.profilesFailed}`)
  console.log(`Transactions encrypted: ${results.txEncrypted}`)
  console.log(`Transactions failed:    ${results.txFailed}`)

  const totalFailed = results.profilesFailed + results.txFailed
  if (totalFailed > 0) {
    console.log(`\n⚠️  Completed with ${totalFailed} errors`)
    process.exit(1)
  } else {
    console.log('\n🎉 All data encrypted successfully!')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('💥 Migration failed:', err)
  process.exit(1)
})
