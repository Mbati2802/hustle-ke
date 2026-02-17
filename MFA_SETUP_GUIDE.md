# 🔐 MFA/TOTP Setup Guide

## Overview
Two-Factor Authentication (2FA) using Time-based One-Time Passwords (TOTP) has been fully implemented in HustleKE. Users can secure their accounts with authenticator apps like Google Authenticator, Authy, or 1Password.

---

## ✅ Features Implemented

### Backend
- **Database Schema** (`029_mfa_totp.sql`)
  - `mfa_settings` table - stores TOTP secrets and backup codes
  - `mfa_verification_log` table - audit trail of MFA attempts
  - RLS policies for user privacy
  - Cleanup function for old logs (90 days)

- **TOTP Utilities** (`src/lib/mfa-totp.ts`)
  - Generate TOTP secrets
  - Generate QR codes for easy setup
  - Verify TOTP tokens
  - Generate and verify backup codes (10 codes, 8 chars each)
  - Hashed storage for security

- **API Endpoints**
  - `POST /api/mfa/setup` - Generate secret and QR code
  - `POST /api/mfa/enable` - Verify and enable MFA
  - `POST /api/mfa/disable` - Disable MFA (requires verification)
  - `POST /api/mfa/verify` - Verify MFA token during login
  - `GET /api/mfa/status` - Get MFA status
  - `POST /api/mfa/backup-codes` - Regenerate backup codes

### Frontend
- **MFA Settings Page** (`/dashboard/settings/mfa`)
  - Status display (enabled/disabled)
  - QR code setup flow
  - Backup codes display and download
  - Regenerate backup codes
  - Disable MFA
  - Copy to clipboard functionality
  - Download backup codes as .txt file

---

## 🎯 User Flow

### Enabling MFA

1. **Navigate to Settings**
   - Go to Dashboard → Settings → Security tab
   - Click "Manage 2FA"

2. **Start Setup**
   - Click "Get Started" button
   - System generates TOTP secret and QR code

3. **Scan QR Code**
   - Open authenticator app (Google Authenticator, Authy, etc.)
   - Scan the displayed QR code
   - Or manually enter the secret key

4. **Verify Code**
   - Enter the 6-digit code from your authenticator app
   - Click "Enable Two-Factor Authentication"

5. **Save Backup Codes**
   - 10 backup codes are displayed
   - Copy or download them to a safe place
   - Each code can only be used once

### Using MFA

**During Login:**
- Enter email and password as usual
- System detects MFA is enabled
- Prompt for 6-digit code
- Enter code from authenticator app
- Or use a backup code if needed

**Backup Codes:**
- Use if you lose access to authenticator app
- Each code works only once
- Regenerate codes if running low

### Disabling MFA

1. Go to MFA settings page
2. Scroll to "Disable Two-Factor Authentication"
3. Enter 6-digit verification code
4. Click "Disable Two-Factor Authentication"

---

## 🔧 Technical Details

### TOTP Configuration
- **Algorithm**: SHA-1 (standard)
- **Window**: 1 step (30 seconds before/after)
- **Digits**: 6
- **Period**: 30 seconds

### Backup Codes
- **Count**: 10 codes per user
- **Format**: 8-character hexadecimal (uppercase)
- **Storage**: SHA-256 hashed
- **Usage**: Single-use, tracked in database

### Security Features
- Secrets stored encrypted in database
- Backup codes hashed with SHA-256
- Verification attempts logged with IP/user agent
- RLS policies prevent unauthorized access
- 90-day log retention

---

## 📊 Database Schema

### `mfa_settings` Table
```sql
- id (UUID)
- user_id (UUID) - references auth.users
- profile_id (UUID) - references profiles
- totp_secret (TEXT) - encrypted TOTP secret
- is_enabled (BOOLEAN)
- backup_codes (TEXT[]) - array of hashed codes
- backup_codes_used (INTEGER)
- verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### `mfa_verification_log` Table
```sql
- id (UUID)
- user_id (UUID)
- profile_id (UUID)
- verification_method (TEXT) - 'totp' or 'backup_code'
- success (BOOLEAN)
- ip_address (TEXT)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

---

## 🚀 Deployment Checklist

### 1. Run Database Migration
```sql
-- In Supabase SQL Editor:
-- Copy and run: supabase/migrations/029_mfa_totp.sql
```

### 2. Install Dependencies
Already installed:
- `otplib` - TOTP generation and verification
- `qrcode` - QR code generation
- `@types/qrcode` - TypeScript types

### 3. Test MFA Flow
- [ ] Enable MFA with authenticator app
- [ ] Verify QR code scanning works
- [ ] Test TOTP code verification
- [ ] Download backup codes
- [ ] Test backup code usage
- [ ] Regenerate backup codes
- [ ] Disable MFA
- [ ] Check verification logs

---

## 🧪 Testing

### Manual Testing Steps

**1. Enable MFA:**
```bash
# Navigate to /dashboard/settings/mfa
# Click "Get Started"
# Scan QR code with Google Authenticator
# Enter 6-digit code
# Verify success message
# Download backup codes
```

**2. Test Login with MFA:**
```bash
# Log out
# Log in with email/password
# Enter TOTP code when prompted
# Verify successful login
```

**3. Test Backup Codes:**
```bash
# Log out
# Log in with email/password
# Use a backup code instead of TOTP
# Verify code is marked as used
# Check remaining codes decreased
```

**4. Regenerate Backup Codes:**
```bash
# Go to MFA settings
# Enter TOTP code
# Click "Regenerate Codes"
# Download new codes
# Verify old codes no longer work
```

**5. Disable MFA:**
```bash
# Go to MFA settings
# Enter TOTP code
# Click "Disable"
# Verify MFA is disabled
# Test login without MFA prompt
```

---

## 🔐 Security Considerations

### Best Practices Implemented
✅ TOTP secrets never exposed to client after setup
✅ Backup codes hashed before storage
✅ Verification attempts logged for audit
✅ Rate limiting on verification endpoints
✅ RLS policies prevent data leakage
✅ Old logs automatically cleaned up

### User Education
- Backup codes should be stored securely
- Don't share TOTP secrets or QR codes
- Regenerate backup codes if compromised
- Use unique codes for each service

---

## 📱 Supported Authenticator Apps

### Recommended
- **Google Authenticator** (iOS/Android)
- **Authy** (iOS/Android/Desktop)
- **1Password** (iOS/Android/Desktop)
- **Microsoft Authenticator** (iOS/Android)
- **LastPass Authenticator** (iOS/Android)

### Requirements
- Must support TOTP (RFC 6238)
- 6-digit codes
- 30-second time step

---

## 🐛 Troubleshooting

### "Invalid verification code"
- **Cause**: Time sync issue or wrong code
- **Fix**: 
  - Check device time is correct
  - Wait for new code to generate
  - Try backup code if available

### "Failed to enable MFA"
- **Cause**: Database or network error
- **Fix**:
  - Check database migration ran
  - Verify API endpoints accessible
  - Check server logs

### QR Code Not Scanning
- **Cause**: Camera permissions or QR quality
- **Fix**:
  - Grant camera permissions
  - Use manual entry with secret key
  - Try different authenticator app

### Lost Authenticator App
- **Solution**: Use backup codes
- **If no backup codes**: Contact support for account recovery

---

## 📈 Metrics to Monitor

### Database
- MFA adoption rate (% of users with MFA enabled)
- Backup code usage frequency
- Failed verification attempts
- Average codes remaining per user

### API
- MFA setup completion rate
- Verification success rate
- Backup code regeneration frequency
- Disable requests

---

## 🎯 Future Enhancements

### Potential Improvements
- [ ] SMS-based 2FA as alternative
- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] Trusted devices (skip MFA for 30 days)
- [ ] Recovery email for account reset
- [ ] Admin dashboard for MFA stats
- [ ] Push notifications for new device logins

---

## ✅ Status

**Implementation:** ✅ Complete  
**Testing:** ⏳ Pending user testing  
**Documentation:** ✅ Complete  
**Deployment:** ⏳ Requires migration

---

## 📚 Resources

- [RFC 6238 - TOTP Specification](https://tools.ietf.org/html/rfc6238)
- [otplib Documentation](https://github.com/yeojz/otplib)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)
- [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

**Status:** ✅ MFA/TOTP Fully Implemented  
**Priority:** P1 - Critical Security Feature  
**Completion:** 100%
