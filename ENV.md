# Environment Variables for Coolify

## Required Environment Variables

Set these in your Coolify project settings:

### 1. Spotify Credentials
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 2. API URL (CRITICAL - Must be set as BUILD-TIME variable)
```env
NEXT_PUBLIC_API_URL=https://api.soundry.download
```

**⚠️ IMPORTANT:** 
- This MUST be set as a **build argument** in Coolify
- It should be your **public API domain** (e.g., `https://api.soundry.download`)
- NOT `http://localhost:3334`

### 3. Domain Configuration (Optional but recommended)
```env
API_DOMAIN=api.soundry.download
FRONTEND_DOMAIN=soundry.download
```

## How to Set in Coolify

### Option A: In Project Settings
1. Go to your project in Coolify
2. Click **"Environment Variables"**
3. Add each variable
4. For `NEXT_PUBLIC_API_URL`, ensure it's marked as **"Build Time"** or **"Build Arg"**
5. Click **Save**
6. **Redeploy** (important!)

### Option B: In docker-compose.prod.yml
The file already includes these as variables:
```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_URL: https://${API_DOMAIN}
  environment:
    - NEXT_PUBLIC_API_URL=https://${API_DOMAIN}
```

## Verification

After deployment, check the browser console:
- ✅ Should see requests to: `https://api.soundry.download/api/...`
- ❌ Should NOT see: `http://localhost:3334/api/...`

## Common Mistakes

### ❌ Wrong:
```env
NEXT_PUBLIC_API_URL=http://localhost:3334
```
**Why:** Browsers can't access localhost from a public domain

### ❌ Wrong:
```env
NEXT_PUBLIC_API_URL=http://api:3001
```
**Why:** Browser can't resolve Docker internal hostnames

### ✅ Correct:
```env
NEXT_PUBLIC_API_URL=https://api.soundry.download
```
**Why:** This is the public URL browsers can access

## Testing

After setting the variables and redeploying:

1. **Open browser console** on your site
2. **Check Network tab**
3. **Look for API requests** - they should go to `https://api.soundry.download`

If you still see `localhost:3334`, the build-time variable wasn't set correctly. You need to:
1. Clear Coolify's build cache
2. Ensure `NEXT_PUBLIC_API_URL` is set as a build argument
3. Redeploy

## Full Example

```env
# Spotify API
SPOTIFY_CLIENT_ID=abc123def456
SPOTIFY_CLIENT_SECRET=xyz789uvw012

# Public URLs (what browsers use)
NEXT_PUBLIC_API_URL=https://api.soundry.download

# Domain configuration
API_DOMAIN=api.soundry.download
FRONTEND_DOMAIN=soundry.download

# Database (optional, has defaults)
DATABASE_URL=file:/app/data/soundry.db
REDIS_URL=redis://redis:6379
NODE_ENV=production
```
