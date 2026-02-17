# 🔧 Render Deployment Fix - Build Cache Issue

## ❌ Problem

Render's build cache is preventing `isomorphic-dompurify` from being installed, causing build failures:

```
Module not found: Can't resolve 'isomorphic-dompurify'
```

## ✅ Solution

**Update your Render build command** to force a clean npm install on every deployment.

### Current Build Command (BROKEN):
```bash
rm -rf .next && npm run build
```

### New Build Command (WORKING):
```bash
rm -rf node_modules .next && npm ci && npm run build
```

## 📋 How to Fix in Render Dashboard

1. Go to https://dashboard.render.com
2. Select your **hustle-ke** service
3. Click **Settings** (left sidebar)
4. Scroll to **Build & Deploy** section
5. Find **Build Command** field
6. Replace with:
   ```bash
   rm -rf node_modules .next && npm ci && npm run build
   ```
7. Click **Save Changes**
8. Click **Manual Deploy** → **Deploy latest commit**

## 🎯 Why This Works

- `rm -rf node_modules` - Deletes cached dependencies
- `npm ci` - Clean install from `package-lock.json` (faster & more reliable than `npm install`)
- `rm -rf .next` - Clears Next.js build cache
- `npm run build` - Builds the app

## ⚡ Alternative: Clear Build Cache (One-Time)

If you don't want to change the build command permanently:

1. Go to Render dashboard
2. Select your service
3. Click **Manual Deploy**
4. Select **Clear build cache & deploy**

This will work once, but the cache issue may return on future deployments.

## 📊 Performance Impact

**First build after change:**
- ~2-3 minutes longer (clean npm install)

**Subsequent builds:**
- Same time (still does clean install each time)
- More reliable (no cache issues)

## 🔄 Recommended Long-Term Solution

Once deployed successfully, you can optimize the build command:

```bash
npm ci && npm run build
```

This keeps `node_modules` cached but ensures all dependencies are correctly installed.

---

**Status:** ⏳ Waiting for manual Render configuration update  
**Next Step:** Update build command in Render dashboard, then redeploy
