# 🔒 reCAPTCHA v3 Setup Guide

## Overview
reCAPTCHA v3 has been integrated into HustleKE to protect login and signup forms from bot attacks. It works invisibly in the background, scoring user interactions without requiring user interaction (no "I'm not a robot" checkbox).

---

## 🎯 Features Implemented

### ✅ What's Protected
- **Login Form** - Bot protection on authentication
- **Signup Form** - Prevent automated account creation
- **Score-Based Detection** - Scores 0.0-1.0 (1.0 = very likely human)
- **Minimum Score: 0.5** - Configurable threshold

### ✅ Files Created
1. `src/lib/recaptcha.ts` - Server-side verification utility
2. `src/contexts/RecaptchaContext.tsx` - Client-side provider
3. Updated `src/app/layout.tsx` - Wrapped app with RecaptchaProvider
4. Updated `src/app/components/AuthModal.tsx` - Added token generation
5. Updated `src/contexts/AuthContext.tsx` - Pass tokens to API
6. Updated `src/app/api/auth/login/route.ts` - Verify tokens
7. Updated `src/app/api/auth/signup/route.ts` - Verify tokens

---

## 🔑 Getting reCAPTCHA Keys

### Step 1: Go to Google reCAPTCHA Admin
Visit: https://www.google.com/recaptcha/admin/create

### Step 2: Register Your Site
- **Label**: HustleKE
- **reCAPTCHA type**: Select **reCAPTCHA v3**
- **Domains**: 
  - `localhost` (for development)
  - `hustleke.co.ke` (your production domain)
  - Add your Render domain if different

### Step 3: Accept Terms
- Check "Accept the reCAPTCHA Terms of Service"
- Click **Submit**

### Step 4: Copy Your Keys
You'll receive two keys:
- **Site Key** (public) - Used in frontend
- **Secret Key** (private) - Used in backend verification

---

## ⚙️ Configuration

### Add to Environment Variables

**Development (`.env.local`):**
```bash
# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

**Production (Render Environment Variables):**
1. Go to Render Dashboard → Your Service → Environment
2. Add:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = your site key
   - `RECAPTCHA_SECRET_KEY` = your secret key
3. Click **Save Changes**
4. Redeploy

---

## 🧪 Testing

### Development Mode (No Keys)
If keys are not configured, reCAPTCHA is **automatically disabled**:
- Login/signup work normally
- No verification happens
- Console shows: `[reCAPTCHA] No secret key configured - skipping verification`

### With Keys Configured
1. **Test Login:**
   - Open browser DevTools → Network tab
   - Try logging in
   - Check request payload includes `recaptchaToken`
   - Server verifies token and returns score

2. **Test Bot Detection:**
   - Automated requests without valid tokens are rejected
   - Low scores (< 0.5) are rejected with error message

3. **Check Logs:**
   ```bash
   # Server logs show:
   [reCAPTCHA] Verification failed: [error-codes]
   [reCAPTCHA] Low score: 0.3
   ```

---

## 📊 How It Works

### Client-Side (Frontend)
1. User fills login/signup form
2. On submit, `executeRecaptcha('login')` generates token
3. Token sent to backend with credentials

### Server-Side (Backend)
1. Extract `recaptchaToken` from request body
2. Call Google's verification API
3. Check response:
   - ✅ `success: true` and `score >= 0.5` → Allow
   - ❌ `success: false` or `score < 0.5` → Reject

### Code Flow
```typescript
// Frontend (AuthModal.tsx)
const token = await executeRecaptcha('login')
await login(email, password, token)

// Backend (login/route.ts)
const result = await verifyRecaptcha(token, 'login')
if (!result.success) {
  return errorResponse('Bot detected', 400)
}
```

---

## 🔧 Customization

### Adjust Score Threshold
Edit `src/lib/recaptcha.ts`:
```typescript
const MIN_SCORE = 0.5 // Change to 0.3 for less strict, 0.7 for more strict
```

### Add to More Forms
```typescript
// In any form component:
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const { executeRecaptcha } = useGoogleReCaptcha()

const handleSubmit = async () => {
  const token = await executeRecaptcha('form_action')
  // Send token with form data
}
```

### Backend Verification
```typescript
import { verifyRecaptcha } from '@/lib/recaptcha'

const token = body.recaptchaToken
const result = await verifyRecaptcha(token, 'form_action')
if (!result.success) {
  return errorResponse(result.error, 400)
}
```

---

## 🚨 Troubleshooting

### "reCAPTCHA verification failed"
- **Check keys are correct** in environment variables
- **Verify domain is registered** in reCAPTCHA admin
- **Check network requests** in DevTools

### "Suspicious activity detected"
- User score is below 0.5
- May happen with VPNs, automated tools
- Lower threshold or whitelist specific IPs

### Keys not working
- **Site key must be public** (`NEXT_PUBLIC_` prefix)
- **Secret key must be private** (no prefix)
- **Restart dev server** after adding env vars
- **Redeploy** after adding to production

### reCAPTCHA badge showing
- Normal behavior for v3
- Badge appears in bottom-right corner
- Can be hidden with CSS (not recommended):
  ```css
  .grecaptcha-badge { visibility: hidden; }
  ```

---

## 📈 Monitoring

### Google reCAPTCHA Admin Console
Visit: https://www.google.com/recaptcha/admin

**View:**
- Request volume
- Score distribution
- Suspicious activity
- Domain verification status

### Server Logs
```bash
# Check verification attempts
grep "reCAPTCHA" logs/app.log

# Check failed verifications
grep "reCAPTCHA.*failed" logs/app.log
```

---

## ✅ Verification Checklist

- [ ] Registered site at Google reCAPTCHA Admin
- [ ] Added site key to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- [ ] Added secret key to `RECAPTCHA_SECRET_KEY`
- [ ] Restarted dev server / redeployed
- [ ] Tested login with valid credentials
- [ ] Tested signup with new account
- [ ] Verified tokens in Network tab
- [ ] Checked server logs for verification
- [ ] Tested with VPN (should still work if score > 0.5)

---

## 🎯 Production Deployment

1. **Get Production Keys:**
   - Register production domain in reCAPTCHA admin
   - Use separate keys for production (recommended)

2. **Add to Render:**
   - Environment → Add variables
   - Redeploy service

3. **Test Production:**
   - Try login/signup on live site
   - Check Render logs for verification
   - Monitor reCAPTCHA admin console

---

## 📚 Resources

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [react-google-recaptcha-v3 Docs](https://github.com/t49tran/react-google-recaptcha-v3)

---

**Status:** ✅ Implemented  
**Mode:** Optional (works without keys in dev)  
**Impact:** Protects against bot attacks on auth forms
