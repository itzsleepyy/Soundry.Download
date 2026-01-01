# YouTube Cookies (Optional Fallback)

## ⚠️ SECURITY NOTICE
**NEVER commit cookie files to Git!** They contain session tokens that could compromise your YouTube account.

This directory is in `.gitignore` to prevent accidental commits.

## Purpose
Cookies are used as a **fallback only** when YouTube bot detection occurs. The system works without them, but having cookies improves reliability.

## Setup

### Option 1: Export from Browser

1. Install browser extension:
   - Firefox: "[cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)"
   - Chrome: "[Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)"

2. Go to YouTube.com (logged in)

3. Export cookies to Netscape format

4. Save as `cookie-1.txt`, `cookie-2.txt`, etc.

5. Place files in this directory:
   ```bash
   packages/worker/cookies/
   ├── cookie-1.txt
   ├── cookie-2.txt
   └── .gitkeep
   ```

### Option 2: Manual yt-dlp Export

```bash
yt-dlp --cookies-from-browser firefox --cookies cookies.txt https://www.youtube.com/
```

Then copy `cookies.txt` to this directory.

## Deployment

### Local Development
Files in this directory are mounted to `/app/cookies` in Docker.

### Production (Coolify/Server)
1. SSH to server
2. Access Docker container:
   ```bash
   docker exec -it soundry_worker bash
   ```
3. Create cookies:
   ```bash
   mkdir -p /app/cookies
   vi /app/cookies/cookie-1.txt
   # Paste cookie content and save
   ```

OR mount via volume:
```bash
# On host
mkdir -p /opt/soundry/cookies
vi /opt/soundry/cookies/cookie-1.txt

# Update docker-compose.prod.yml volume:
- /opt/soundry/cookies:/app/cookies:ro
```

## Cookie Rotation
The system automatically rotates through available cookie files if one encounters bot detection.

## Expiration
YouTube cookies typically expire after ~6 months. Refresh when needed by re-exporting from browser.

## Testing
Check logs for:
```
[YouTube] Found 2 cookie file(s) available
[YouTube] Using cookie file: cookie-1.txt
```
