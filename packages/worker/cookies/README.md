# YouTube Cookies (Optional Fallback)

## ⚠️ SECURITY NOTICE
**NEVER commit cookie files to Git!** They contain session tokens that could compromise your YouTube account.

## Purpose
Cookies are used as a **fallback only** when YouTube bot detection occurs (HTTP 403). The system works without them, but having cookies improves reliability.

## Setup via Environment Variables (Recommended for Production)

### 1. Export Cookies from Browser

Install browser extension:
- Firefox: "[cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)"
- Chrome: "[Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)"

1. Go to YouTube.com (logged in)
2. Export cookies to Netscape format
3. **Copy the entire content** of the cookie file

### 2. Add to Environment Variables

**In Coolify:**
1. Go to your application settings
2. Add environment variables:
   ```
   YOUTUBE_COOKIE_1=<paste entire cookie file content>
   YOUTUBE_COOKIE_2=<optional: second cookie for rotation>
   ```
3. Redeploy

**In `.env` (local):**
```bash
YOUTUBE_COOKIE_1="# Netscape HTTP Cookie File
# This is a generated file! Do not edit.
.youtube.com	TRUE	/	TRUE	1234567890	..."
```

The startup script automatically converts these to files at `/app/cookies/cookie-1.txt`, `/app/cookies/cookie-2.txt`, etc.

---

## Alternative: Manual File Setup (Local Development)

For local development, you can place cookie files directly:

```bash
packages/worker/cookies/
├── cookie-1.txt
├── cookie-2.txt
└── .gitkeep
```

These files are in `.gitignore` to prevent accidental commits.

---

## Cookie Rotation
The system automatically rotates through available cookie files if one encounters bot detection.

## Expiration
YouTube cookies typically expire after ~6 months. Refresh when needed by re-exporting from browser and updating the environment variable.

## Testing
Check logs for:
```
Writing cookie file from YOUTUBE_COOKIE_1...
Created /app/cookies/cookie-1.txt
[YouTube] Found 2 cookie file(s) available
[YouTube] Using cookie file: cookie-1.txt
```
