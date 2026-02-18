# 🔒 Security Implementation Guide
## Critical Security Fixes - Deployment Instructions

**Date:** February 18, 2026  
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours

---

## 📋 OVERVIEW

This guide walks you through implementing the critical security fixes identified in the security audit. These fixes address:

1. ✅ **CSRF Protection** - Prevents unauthorized state-changing operations
2. ✅ **Atomic Transactions** - Eliminates race conditions in financial operations
3. ✅ **Field-Level Encryption** - Protects sensitive data at rest
4. ✅ **Idempotency Keys** - Prevents duplicate payment processing
5. ✅ **Comprehensive Audit Logging** - Tracks all critical operations

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Set Environment Variables (5 minutes)

Add these to your `.env.local` (development) and production environment:

```bash
# Encryption Key (REQUIRED)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_string_here

# Example generation:
# openssl rand -hex 32
# Output: a1b2c3d4e5f6...
```

**⚠️ CRITICAL:** 
- Generate a unique key for production
- Store securely (use AWS Secrets Manager, HashiCorp Vault, or similar)
- Never commit to version control
- Backup the key securely (losing it means losing encrypted data)

---

### Step 2: Run Database Migrations (10 minutes)

Run the new migrations in order:

```bash
# Connect to your Supabase project
npx supabase db push

# Or manually run these migrations:
# 1. supabase/migrations/032_atomic_transactions.sql
# 2. supabase/migrations/033_audit_logs.sql
```

**What these migrations do:**
- Create atomic transaction functions for wallet and escrow operations
- Create `idempotency_log` table
- Create `audit_logs` table
- Add row-level security policies

**Verify migrations:**
```sql
-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('withdraw_funds', 'deposit_funds', 'create_escrow_transaction', 'release_escrow_funds', 'refund_escrow_funds');

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('idempotency_log', 'audit_logs');
```

---

### Step 3: Update Frontend Code (15 minutes)

#### 3.1 Update API Calls to Include CSRF Token

**Example: Wallet Withdrawal**

```typescript
// Before (VULNERABLE)
const response = await fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 1000, mpesa_phone: '0712345678' })
})

// After (SECURE)
import { withCSRF } from '@/hooks/useCSRFToken'

const response = await fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: withCSRF({ 'Content-Type': 'application/json' }),
  body: JSON.stringify({ amount: 1000, mpesa_phone: '0712345678' })
})
```

#### 3.2 Add Idempotency Keys to Payment Operations

```typescript
import { generateIdempotencyKey } from '@/lib/idempotency'

// For critical operations (withdrawals, deposits, escrow)
const idempotencyKey = generateIdempotencyKey()

const response = await fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: withCSRF({
    'Content-Type': 'application/json',
    'idempotency-key': idempotencyKey
  }),
  body: JSON.stringify({ amount: 1000, mpesa_phone: '0712345678' })
})
```

#### 3.3 Files to Update

Update these frontend files to use CSRF tokens:

- `src/app/dashboard/wallet/page.tsx` - Withdraw/deposit forms
- `src/app/dashboard/projects/page.tsx` - Accept/reject proposals
- `src/app/dashboard/escrow/page.tsx` - Release/refund escrow
- `src/app/dashboard/settings/page.tsx` - Profile updates, password changes

**Search and replace pattern:**
```typescript
// Find:
fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },

// Replace with:
import { withCSRF } from '@/hooks/useCSRFToken'
fetch('/api/wallet/withdraw', {
  method: 'POST',
  headers: withCSRF({ 'Content-Type': 'application/json' }),
```

---

### Step 4: Encrypt Existing Data (30-60 minutes)

**⚠️ IMPORTANT:** This is a one-time migration. Test on staging first!

#### 4.1 Create Migration Script

```typescript
// scripts/encrypt-existing-data.ts
import { createClient } from '@supabase/supabase-js'
import { encryptPhone, isEncrypted } from '../src/lib/encryption'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function encryptExistingData() {
  console.log('🔐 Starting data encryption migration...')
  
  // Encrypt M-Pesa phone numbers in profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)
  
  let encrypted = 0
  for (const profile of profiles || []) {
    if (profile.mpesa_phone && !isEncrypted(profile.mpesa_phone)) {
      const encryptedPhone = encryptPhone(profile.mpesa_phone)
      await supabase
        .from('profiles')
        .update({ mpesa_phone: encryptedPhone })
        .eq('id', profile.id)
      encrypted++
    }
  }
  
  console.log(`✅ Encrypted ${encrypted} phone numbers in profiles`)
  
  // Encrypt phone numbers in wallet_transactions
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('id, mpesa_phone')
    .not('mpesa_phone', 'is', null)
  
  encrypted = 0
  for (const tx of transactions || []) {
    if (tx.mpesa_phone && !isEncrypted(tx.mpesa_phone)) {
      const encryptedPhone = encryptPhone(tx.mpesa_phone)
      await supabase
        .from('wallet_transactions')
        .update({ mpesa_phone: encryptedPhone })
        .eq('id', tx.id)
      encrypted++
    }
  }
  
  console.log(`✅ Encrypted ${encrypted} phone numbers in transactions`)
  console.log('🎉 Migration complete!')
}

encryptExistingData().catch(console.error)
```

#### 4.2 Run Migration

```bash
# Install dependencies
npm install

# Run migration (TEST ON STAGING FIRST!)
npx ts-node scripts/encrypt-existing-data.ts
```

#### 4.3 Verify Encryption

```sql
-- Check if data is encrypted (should see format: hex:hex:hex)
SELECT id, mpesa_phone FROM profiles WHERE mpesa_phone IS NOT NULL LIMIT 5;
SELECT id, mpesa_phone FROM wallet_transactions WHERE mpesa_phone IS NOT NULL LIMIT 5;

-- Encrypted format looks like:
-- "a1b2c3d4e5f6:9876543210ab:fedcba0987654321"
```

---

### Step 5: Update Profile API to Decrypt Data (10 minutes)

Update profile retrieval to decrypt sensitive fields:

```typescript
// src/app/api/profile/route.ts
import { decryptPhone, safeDecrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof Response) return auth
  
  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('*')
    .eq('user_id', auth.userId)
    .single()
  
  // Decrypt sensitive fields before sending to client
  if (profile && profile.mpesa_phone) {
    profile.mpesa_phone = safeDecrypt(profile.mpesa_phone)
  }
  
  return jsonResponse({ profile })
}
```

**Apply to these files:**
- `src/app/api/profile/route.ts`
- `src/app/api/profile/[id]/route.ts`
- `src/app/api/wallet/transactions/route.ts`

---

### Step 6: Test Security Fixes (30 minutes)

#### 6.1 Test CSRF Protection

```bash
# Should FAIL (no CSRF token)
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"amount": 1000, "mpesa_phone": "0712345678"}'

# Expected: 403 Forbidden - CSRF token validation failed
```

#### 6.2 Test Race Condition Fix

```bash
# Try concurrent withdrawals (should prevent double-spending)
# Terminal 1:
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -H "x-csrf-token: your-csrf-token" \
  -d '{"amount": 900}' &

# Terminal 2 (immediately):
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -H "x-csrf-token": "your-csrf-token" \
  -d '{"amount": 900}' &

# Expected: One succeeds, one fails with "Insufficient balance"
```

#### 6.3 Test Idempotency

```bash
# Send same request twice with same idempotency key
IDEMPOTENCY_KEY=$(uuidgen)

# Request 1
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -H "x-csrf-token: your-csrf-token" \
  -H "idempotency-key: $IDEMPOTENCY_KEY" \
  -d '{"amount": 100}'

# Request 2 (same key)
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -H "x-csrf-token: your-csrf-token" \
  -H "idempotency-key: $IDEMPOTENCY_KEY" \
  -d '{"amount": 100}'

# Expected: Second request returns cached response, no duplicate withdrawal
```

#### 6.4 Test Encryption

```typescript
// Test encryption/decryption
import { encrypt, decrypt, encryptPhone, decryptPhone } from '@/lib/encryption'

const phone = '0712345678'
const encrypted = encryptPhone(phone)
console.log('Encrypted:', encrypted) // Should be hex:hex:hex format

const decrypted = decryptPhone(encrypted)
console.log('Decrypted:', decrypted) // Should be '0712345678'
```

#### 6.5 Test Audit Logging

```sql
-- Check if operations are being logged
SELECT * FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Should see entries for:
-- - wallet_withdraw
-- - wallet_deposit
-- - escrow_create
-- - escrow_release
```

---

### Step 7: Deploy to Production (15 minutes)

#### 7.1 Pre-Deployment Checklist

- [ ] All tests pass
- [ ] ENCRYPTION_KEY set in production environment
- [ ] Database migrations run successfully
- [ ] Staging environment tested
- [ ] Backup database before deployment
- [ ] Rollback plan prepared

#### 7.2 Deployment Steps

```bash
# 1. Backup database
npx supabase db dump > backup-$(date +%Y%m%d).sql

# 2. Run migrations on production
npx supabase db push --project-ref your-project-ref

# 3. Deploy application
git push production main

# 4. Run data encryption migration
npm run encrypt-data:production

# 5. Verify deployment
curl -I https://your-domain.com/api/health
```

#### 7.3 Post-Deployment Verification

```bash
# Check security headers
curl -I https://your-domain.com | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options)"

# Test CSRF protection
curl -X POST https://your-domain.com/api/wallet/withdraw \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
# Expected: 403 Forbidden

# Check audit logs
# Login to Supabase dashboard → SQL Editor
SELECT COUNT(*) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '1 hour';
```

---

## 🔍 MONITORING & ALERTS

### Set Up Monitoring

1. **High-Value Transaction Alerts**
```sql
-- Create alert for transactions > 10,000 KES
SELECT * FROM audit_logs 
WHERE amount > 10000 
AND timestamp > NOW() - INTERVAL '5 minutes';
```

2. **Failed Security Operations**
```sql
-- Alert on failed security events
SELECT * FROM audit_logs 
WHERE success = false 
AND action IN ('wallet_withdraw', 'escrow_release', 'password_change')
AND timestamp > NOW() - INTERVAL '5 minutes';
```

3. **CSRF Attack Attempts**
```bash
# Monitor application logs for CSRF failures
grep "CSRF token validation failed" /var/log/app.log | tail -n 50
```

### Recommended Monitoring Tools

- **Application Monitoring:** Datadog, New Relic, or Sentry
- **Log Aggregation:** ELK Stack, Splunk, or Papertrail
- **Uptime Monitoring:** Pingdom, UptimeRobot
- **Security Monitoring:** Snyk, GuardDuty

---

## 🚨 ROLLBACK PLAN

If issues occur after deployment:

### Immediate Rollback

```bash
# 1. Revert application code
git revert HEAD
git push production main

# 2. Restore database from backup
npx supabase db reset --db-url "postgresql://..."

# 3. Restore from backup file
psql -d your_database < backup-20260218.sql
```

### Partial Rollback (Keep Migrations)

If only application code has issues:

```bash
# Revert code changes only
git revert HEAD~3..HEAD  # Revert last 3 commits
git push production main

# Migrations remain in place (safe)
```

---

## 📊 SUCCESS METRICS

After deployment, verify these metrics:

| Metric | Target | How to Check |
|--------|--------|--------------|
| CSRF Protection Active | 100% | All POST/PUT/DELETE require token |
| Race Conditions Fixed | 0 errors | No negative balances in wallets |
| Data Encrypted | 100% | All mpesa_phone fields encrypted |
| Audit Logs Working | 100% | All financial ops logged |
| Idempotency Working | 100% | Duplicate requests cached |

---

## 🆘 TROUBLESHOOTING

### Issue: "ENCRYPTION_KEY not set"

**Solution:**
```bash
# Generate new key
openssl rand -hex 32

# Add to .env.local
echo "ENCRYPTION_KEY=your_generated_key" >> .env.local

# Restart application
npm run dev
```

### Issue: "CSRF token validation failed"

**Symptoms:** All API requests fail with 403

**Solution:**
1. Check if CSRF cookie is being set
2. Verify `withCSRF()` is used in frontend
3. Check browser console for cookie issues
4. Ensure SameSite=Strict is compatible with your setup

### Issue: "Function does not exist: withdraw_funds"

**Symptoms:** Database errors when calling atomic functions

**Solution:**
```bash
# Re-run migrations
npx supabase db push

# Or manually run:
psql -d your_database < supabase/migrations/032_atomic_transactions.sql
```

### Issue: "Cannot decrypt data"

**Symptoms:** Decryption errors when reading profiles

**Solution:**
1. Verify ENCRYPTION_KEY matches the one used for encryption
2. Check if data is actually encrypted (format: hex:hex:hex)
3. Use `safeDecrypt()` instead of `decrypt()` for backward compatibility

---

## 📚 ADDITIONAL RESOURCES

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PCI DSS 4.0 Requirements](https://www.pcisecuritystandards.org/)
- [PostgreSQL Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)

---

## ✅ COMPLETION CHECKLIST

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Frontend code updated with CSRF tokens
- [ ] Existing data encrypted
- [ ] All tests passing
- [ ] Deployed to staging
- [ ] Deployed to production
- [ ] Monitoring configured
- [ ] Team trained on new security features
- [ ] Documentation updated

---

**Questions or Issues?**  
Contact: security@hustleke.com  
Emergency: +254-XXX-XXXXXX

---

*Last Updated: February 18, 2026*  
*Version: 1.0*
