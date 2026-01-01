# YouTube Cookies Setup for Hetzner

## Quick Setup

On your Hetzner server:

```bash
# 1. Create cookies directory
mkdir -p /opt/soundry/Soundry.Download/cookies

# 2. Create a cookie file
nano /opt/soundry/Soundry.Download/cookies/cookie-1.txt
```

**Paste your YouTube cookie content** (Netscape format), save and exit (Ctrl+X, Y, Enter).

```bash
# 3. Restart workers to use the new cookies
cd /opt/soundry/Soundry.Download
docker compose -f docker-compose.prod2.yml restart worker

# 4. Check logs
docker compose -f docker-compose.prod2.yml logs worker | grep -i cookie
```

You should see:
```
✓ Found cookie file: /app/cookies/cookie-1.txt
```

---

## How to Export YouTube Cookies

### Method 1: Browser Extension (Easiest)

**Firefox:**
1. Install "[cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)"
2. Go to YouTube.com (logged in)
3. Click extension icon → Export
4. Save as `cookie-1.txt`

**Chrome:**
1. Install "[Get cookies.txt](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)"
2. Go to YouTube.com (logged in)
3. Click extension icon → Export
4. Save as `cookie-1.txt`

### Method 2: yt-dlp (Alternative)

```bash
# On your local machine
yt-dlp --cookies-from-browser firefox --cookies cookies.txt https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Copy cookies.txt to server
scp cookies.txt root@YOUR_SERVER_IP:/opt/soundry/Soundry.Download/cookies/cookie-1.txt
```

---

## Multiple Cookies (Rotation)

For better reliability, add multiple cookie files:

```bash
/opt/soundry/Soundry.Download/cookies/
├── cookie-1.txt  # From Account 1
├── cookie-2.txt  # From Account 2
└── cookie-3.txt  # From Account 3
```

The worker will automatically rotate through them.

---

## Security

**✅ Safe:**
- Cookies are mounted read-only (`:ro`)
- Not committed to git (in `.gitignore`)
- Only accessible inside containers

**⚠️ Important:**
- Never commit cookies to GitHub
- Refresh cookies every ~6 months (they expire)
- Use separate Google accounts if possible

---

## Troubleshooting

**"No cookies available for fallback"**
```bash
# Check if cookie files exist
ls -la /opt/soundry/Soundry.Download/cookies/

# Check if mounted in container
docker exec soundry-worker-1 ls -la /app/cookies/
```

**"Invalid cookie format"**
```bash
# First line should be:
head -n 1 /opt/soundry/Soundry.Download/cookies/cookie-1.txt
# Output: # Netscape HTTP Cookie File
```

**Cookies expired**
- Re-export from browser
- Replace old cookie files
- Restart workers
