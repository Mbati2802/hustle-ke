# Security Headers Fix

**Date:** February 18, 2026  
**Status:** ✅ Fixed

## Issues Found

Security scan identified the following issues:
1. ❌ Missing `Strict-Transport-Security` (HSTS) header
2. ❌ Missing `Content-Security-Policy` (CSP) directive
3. ❌ Deprecated `X-XSS-Protection` header present
4. ❌ Invalid `stale-while-revalidate` in Cache-Control

---

## Fixes Applied

### 1. ✅ Added HSTS Header
**Location:** `src/middleware.ts`

```typescript
res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
```

**What it does:**
- Forces HTTPS for 1 year (31536000 seconds)
- Applies to all subdomains
- Eligible for browser preload list

---

### 2. ✅ Added Content Security Policy (CSP)
**Location:** `src/middleware.ts`

```typescript
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.supabase.co https://www.google.com https://vercel.live wss://*.supabase.co",
  "frame-src 'self' https://www.google.com https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join('; ')
res.headers.set('Content-Security-Policy', csp)
```

**What it does:**
- **default-src 'self'**: Only load resources from same origin by default
- **script-src**: Allow scripts from self, Google (reCAPTCHA), and inline scripts
- **style-src**: Allow styles from self, Google Fonts, and inline styles
- **font-src**: Allow fonts from self and Google Fonts
- **img-src**: Allow images from self, data URIs, HTTPS sources, and blobs
- **connect-src**: Allow connections to self, Supabase, Google, and WebSockets
- **frame-src**: Allow frames from self, Google (reCAPTCHA), and Vercel
- **object-src 'none'**: Block all plugins (Flash, Java, etc.)
- **base-uri 'self'**: Restrict base tag to same origin
- **form-action 'self'**: Forms can only submit to same origin
- **frame-ancestors 'none'**: Prevent site from being framed (clickjacking protection)
- **upgrade-insecure-requests**: Automatically upgrade HTTP to HTTPS

---

### 3. ✅ Removed Deprecated X-XSS-Protection
**Location:** `src/middleware.ts`

**Before:**
```typescript
res.headers.set('X-XSS-Protection', '1; mode=block')
```

**After:**
```typescript
// Removed - deprecated and not needed with CSP
```

**Why removed:**
- Deprecated by modern browsers
- Replaced by Content-Security-Policy
- Can cause security vulnerabilities in older browsers

---

### 4. ✅ Fixed Cache-Control Directives
**Location:** `next.config.mjs`

**Added proper cache control:**
```javascript
// Static assets (JS, CSS) - cache for 1 year
{
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable',
    },
  ],
}

// Images - cache for 1 day with revalidation
{
  source: '/images/:path*',
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=86400, must-revalidate',
    },
  ],
}
```

**What changed:**
- Removed invalid `stale-while-revalidate` directive
- Added proper `max-age` values
- Used `immutable` for static assets (never change)
- Used `must-revalidate` for images (check freshness)

---

## Security Headers Summary

### Now Configured:
✅ **Strict-Transport-Security** - Force HTTPS  
✅ **Content-Security-Policy** - Control resource loading  
✅ **X-Content-Type-Options** - Prevent MIME sniffing  
✅ **X-Frame-Options** - Prevent clickjacking  
✅ **Referrer-Policy** - Control referrer information  
✅ **Permissions-Policy** - Control browser features  
✅ **Cache-Control** - Proper caching directives  

### Removed:
❌ **X-XSS-Protection** - Deprecated, replaced by CSP

---

## Testing

### 1. Check Headers Locally
```bash
npm run dev
curl -I http://localhost:3000
```

### 2. Check Headers in Production
```bash
curl -I https://your-domain.com
```

### 3. Use Security Header Scanners
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## Expected Results

### Security Headers Scan
- ✅ A+ rating on securityheaders.com
- ✅ All critical headers present
- ✅ No deprecated headers
- ✅ Proper CSP configuration

### Browser Console
- ✅ No CSP violations (check console)
- ✅ All resources load correctly
- ✅ reCAPTCHA works
- ✅ Supabase connections work

---

## CSP Adjustments (If Needed)

If you add new third-party services, update CSP in `src/middleware.ts`:

### Add new script source:
```typescript
"script-src 'self' 'unsafe-inline' https://new-service.com",
```

### Add new connection:
```typescript
"connect-src 'self' https://*.supabase.co https://new-api.com",
```

### Add new frame source:
```typescript
"frame-src 'self' https://new-iframe-source.com",
```

---

## Production Deployment

### 1. Build and Test
```bash
npm run build
npm start
```

### 2. Verify Headers
```bash
curl -I http://localhost:3000
```

### 3. Deploy
```bash
git add -A
git commit -m "Fix security headers: Add HSTS and CSP, remove deprecated headers"
git push origin main
```

### 4. Verify in Production
- Run security scan on production URL
- Check browser console for CSP violations
- Test all functionality (auth, uploads, payments)

---

## Notes

### HSTS Preload
To add your domain to the HSTS preload list:
1. Ensure HSTS header is set with `preload` directive
2. Visit https://hstspreload.org/
3. Submit your domain
4. Wait for inclusion (can take months)

### CSP Report-Only Mode
To test CSP without breaking functionality:
```typescript
res.headers.set('Content-Security-Policy-Report-Only', csp)
```

This will log violations without blocking resources.

### Strict CSP (Future Enhancement)
For maximum security, consider:
- Remove `'unsafe-inline'` from script-src
- Remove `'unsafe-eval'` from script-src
- Use nonces or hashes for inline scripts
- Implement CSP reporting endpoint

---

## Files Modified

1. `src/middleware.ts` - Added HSTS and CSP, removed X-XSS-Protection
2. `next.config.mjs` - Added proper Cache-Control headers

---

## References

- [MDN: Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP: Secure Headers](https://owasp.org/www-project-secure-headers/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Status:** ✅ All security header issues resolved
