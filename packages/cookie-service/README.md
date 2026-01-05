# Cookie Service

Automated YouTube cookie generation using Puppeteer with stealth plugins.

## Purpose

Generates fresh, valid YouTube session cookies for use with yt-dlp downloads. The service:

1. Launches headless Chromium through residential proxies
2. Visits YouTube to establish authentic sessions
3. Exports cookies in Netscape format
4. Runs on a configurable schedule (default: 7 days)

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_URLS` | - | Comma-separated proxy URLs |
| `COOKIE_REFRESH_DAYS` | 7 | Days between refreshes |
| `NUM_COOKIE_SESSIONS` | 3 | Number of cookie files |
| `COOKIES_DIR` | /app/cookies | Output directory |

## Usage

### As Service (Recommended)
The service runs continuously in docker-compose:

```yaml
cookie-service:
  build: ./packages/cookie-service
  volumes:
    - soundry-cookies:/app/cookies
```

### One-Shot Generation
For manual cookie generation:

```bash
PROXY_URLS="http://user:pass@proxy.com:8080" node src/generate.js
```

## Architecture

```
cookie-service/
├── Dockerfile        # Alpine + Chromium
├── package.json      # Puppeteer dependencies
└── src/
    ├── index.js      # Service with scheduler
    ├── generator.js  # Core Puppeteer logic
    └── generate.js   # One-shot script
```

## Output Format

Cookies are saved in Netscape format compatible with yt-dlp:

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1735819234	CONSENT	YES
.youtube.com	TRUE	/	TRUE	1767355234	__Secure-YEC	...
```
