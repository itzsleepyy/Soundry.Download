# Hetzner Cloud Deployment Guide

## Why Hetzner?
- **€7/month** for 3 vCPUs, 4GB RAM (CPX21)
- Full Docker control - run unlimited workers
- European data centers (GDPR compliant)
- Excellent performance and uptime

---

## Quick Deploy (15 minutes)

### Step 1: Create Hetzner Account & Server

1. **Sign up**: [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. **Create Project**: "Soundry Production"
3. **Add Server**:
   - **Location**: Choose closest to your users (e.g., Nuremberg, Germany)
   - **Image**: Ubuntu 24.04
   - **Type**: CPX21 (3 vCPU, 4GB RAM) - €7.26/month
   - **Networking**: Enable IPv4
   - **SSH Key**: Add your public key (or create password)
   - **Name**: soundry-prod
4. **Create**: Server will be ready in ~30 seconds
5. **Note the IP**: You'll get a public IP like `65.108.x.x`

---

### Step 2: Initial Server Setup (SSH)

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh

# Install Git
apt install -y git

# Create app directory
mkdir -p /opt/soundry
cd /opt/soundry
```

---

### Step 3: Clone & Configure Your App

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/Soundry.Download.git .

# Create environment file
nano .env
```

**Add these to `.env`:**
```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Worker Scaling
WORKER_CONCURRENCY=10

# YouTube Cookies (optional but recommended)
YOUTUBE_COOKIE_1="# Netscape HTTP Cookie File
# Paste your full cookie file here
.youtube.com	TRUE	/	TRUE	1735819234	CONSENT	YES+
..."
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

---

### Step 4: Deploy with Docker Compose

```bash
# Deploy all services with 5 workers (50 concurrent jobs)
docker compose -f docker-compose.prod.yml up -d --scale worker=5

# Check status
docker ps

# You should see:
# - soundry_api
# - soundry_frontend  
# - soundry_worker_1, worker_2, worker_3, worker_4, worker_5
# - soundry_redis

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

### Step 5: Configure DNS & Traefik (For Custom Domains)

Your app is running, but on ports. We need Traefik for HTTPS and custom domains.

#### 5a. Install Traefik

```bash
# Create Traefik network
docker network create traefik-public

# Create Traefik directory
mkdir -p /opt/traefik && cd /opt/traefik

# Create traefik.yml
cat > traefik.yml << 'EOF'
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

providers:
  docker:
    exposedByDefault: false
    network: traefik-public
EOF

# Update email in traefik.yml
nano traefik.yml  # Change your-email@example.com

# Create docker-compose.yml for Traefik
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
EOF

# Start Traefik
docker compose up -d
```

#### 5b. Update Soundry docker-compose

```bash
cd /opt/soundry

# Edit docker-compose.prod.yml to add Traefik labels
nano docker-compose.prod.yml
```

**Important changes needed:** (I'll prepare the file for you below)

#### 5c. Configure DNS

In your domain registrar (where you bought soundry.download):

**Add these A records:**
```
Type: A
Name: @
Value: YOUR_SERVER_IP
TTL: 300

Type: A
Name: api
Value: YOUR_SERVER_IP
TTL: 300
```

Wait 5-10 minutes for DNS propagation. Test with:
```bash
dig soundry.download
dig api.soundry.download
```

---

### Step 6: Restart Soundry with Traefik Integration

```bash
cd /opt/soundry

# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Restart with Traefik network and 5 workers
docker compose -f docker-compose.prod.yml up -d --scale worker=5

# Verify
docker ps
docker compose -f docker-compose.prod.yml logs -f
```

---

### Step 7: Verify Deployment

1. **Visit**: `https://soundry.download` - should work with HTTPS!
2. **Check API**: `https://api.soundry.download/health`
3. **Submit a download**: Test the full flow
4. **Check workers**: `docker ps | grep worker` - should show 5 workers

---

## Scaling Workers

```bash
# Scale to 10 workers (100 concurrent downloads!)
docker compose -f docker-compose.prod.yml up -d --scale worker=10

# Scale down to 3
docker compose -f docker-compose.prod.yml up -d --scale worker=3

# Check status
docker ps | grep worker
```

---

## Maintenance Commands

```bash
# View logs
docker compose -f docker-compose.prod2.yml logs -f worker

# Restart all services
docker compose -f docker-compose.prod2.yml restart

# Update code
cd /opt/soundry
git pull
  docker compose -f docker-compose.prod2.yml up -d --build --scale worker=5

# Check disk space
df -h

# Clean up old Docker images
docker system prune -a
```

---

## Monitoring & Backups

### Disk Usage
```bash
# Check downloads folder size
du -sh /opt/soundry/data/downloads

# Set up automatic cleanup (optional)
crontab -e
# Add: 0 2 * * * find /opt/soundry/data/downloads -type f -mtime +7 -delete
```

### Database Backups
```bash
# Backup script
cat > /opt/backup-soundry.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/opt/backups
mkdir -p $BACKUP_DIR
cp /opt/soundry/data/soundry.db $BACKUP_DIR/soundry-$(date +%Y%m%d).db
# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/backup-soundry.sh

# Run daily at 3am
crontab -e
# Add: 0 3 * * * /opt/backup-soundry.sh
```

---

## Troubleshooting

### "Can't connect to Redis"
```bash
docker logs soundry_redis
docker restart soundry_redis
```

### "Worker not processing jobs"
```bash
docker logs soundry_worker_1
# Check Redis connection
docker exec soundry_worker_1 ping -c 1 redis
```

### "Out of disk space"
```bash
df -h
# Clean downloads
rm -rf /opt/soundry/data/downloads/*
# Clean Docker
docker system prune -a -f
```

### "High CPU usage"
```bash
htop
# Reduce worker concurrency
nano /opt/soundry/.env
# Set WORKER_CONCURRENCY=5
docker compose -f docker-compose.prod.yml restart worker
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| CPX21 Server | €7.26/month |
| Bandwidth (20TB included) | Free |
| Backups (optional) | €1.45/month |
| **Total** | **€7-9/month** |

Compare to Railway: ~$25-35/month

---

## Security Best Practices

```bash
# Set up firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Disable root SSH (after creating sudo user)
adduser soundry
usermod -aG sudo soundry
# Then disable root login in /etc/ssh/sshd_config
```

---

## Next Steps

1. ✅ Deploy to Hetzner
2. ✅ Configure DNS
3. ✅ Scale workers
4. ⏳ Remove announcement banner (after testing)
5. ⏳ Set up monitoring (optional: Uptime Robot, Better Stack)
6. ⏳ Configure automated backups

You're live! 🚀

# Hybrid Download Setup - Runbook

This runbook documents how to configure and operate the hybrid download system using residential proxies and automated cookie generation.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│  cookie-service │────▶│ /app/cookies    │───┐
│  (Puppeteer)    │     │ (shared volume) │   │
└─────────────────┘     └─────────────────┘   │
                                               ▼
┌─────────────────┐     ┌─────────────────┐   ┌─────────────────┐
│  Oxylabs        │◀────│     worker      │◀──│  BullMQ Jobs    │
│  Residential    │     │   (yt-dlp)      │   │                 │
│  Proxies        │     └─────────────────┘   └─────────────────┘
└─────────────────┘
```

## 1. Residential Proxy Setup (Oxylabs)

### Create Oxylabs Account
1. Sign up at [oxylabs.io](https://oxylabs.io)
2. Purchase Residential Proxies (pay-per-GB)
3. Note your credentials:
   - Username (format: `customer-USERNAME`)
   - Password
   - Endpoint: `pr.oxylabs.io:7777`

### Configure Proxy URL

Add to your environment variables in Coolify or `.env`:

```bash
# Single proxy endpoint (Oxylabs auto-rotates IPs)
PROXY_URLS="http://customer-USERNAME:PASSWORD@pr.oxylabs.io:7777"

# Or multiple endpoints for redundancy
PROXY_URLS="http://user:pass@pr.oxylabs.io:7777,http://user:pass@pr2.oxylabs.io:7777"
```

### Oxylabs Proxy Formats

| Type | URL Format |
|------|------------|
| Rotating | `http://customer-USER:PASS@pr.oxylabs.io:7777` |
| Sticky Session | `http://customer-USER-sessid-ABC123:PASS@pr.oxylabs.io:7777` |
| Country Target | `http://customer-USER-cc-US:PASS@pr.oxylabs.io:7777` |

## 2. Cookie Service Configuration

The cookie-service automatically generates fresh YouTube cookies using Puppeteer:

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROXY_URLS` | - | Proxies for cookie generation |
| `COOKIE_REFRESH_DAYS` | 7 | Days between cookie regeneration |
| `NUM_COOKIE_SESSIONS` | 3 | Number of cookie files to generate |

### How It Works
1. On startup, generates N cookie sessions via Puppeteer
2. Each session uses a different proxy (round-robin)
3. Cookies saved to `/app/cookies/cookie-1.txt`, etc.
4. Worker reads cookies from same volume
5. Refreshes automatically every N days

### Manual Cookie Generation

If cookie-service isn't running, generate manually:

```bash
# SSH into server
docker exec -it soundry_cookie-service sh

# Generate single cookie
node src/generate.js

# Or with custom name
node src/generate.js cookie-manual
```

## 3. Adding New Proxies

### Via Environment Variable

```bash
# Update PROXY_URLS in Coolify
PROXY_URLS="http://proxy1...,http://proxy2...,http://proxy3..."
```

Then redeploy the worker service.

### Supported Formats

- HTTP: `http://user:pass@host:port`
- HTTPS: `https://user:pass@host:port`
- SOCKS5: `socks5://user:pass@host:port`

## 4. Retry Logic & Failure Handling

### Worker Behavior

1. **Per-request**: Gets healthy proxy + healthy cookie
2. **On 403/429/CAPTCHA**: Marks pair as degraded, rotates to next
3. **After 3 consecutive failures**: Proxy marked degraded for 5 minutes
4. **If all proxies exhausted**: Job fails with clear error message

### Error Types

| Error | Meaning | Action |
|-------|---------|--------|
| HTTP 403 | Bot block | Rotate proxy |
| HTTP 429 | Rate limit | Rotate proxy |
| CAPTCHA | Challenge detected | Rotate cookie |
| Timeout | Proxy dead | Rotate proxy |

### Recovery

- Degraded proxies recover after 5 minutes
- Cookie-service regenerates automatically
- No manual intervention needed for transient issues

## 5. Monitoring & Debugging

### Check Proxy Status

```bash
# View worker logs
docker logs soundry_worker --tail 100 | grep ProxyManager

# Example output:
# [ProxyManager] Loaded 2 proxy(ies)
# [ProxyManager] Proxy 1 success (total: 42)
# [ProxyManager] Proxy 2 DEGRADED: http://***@pr.oxylabs.io:7777
```

### Check Cookie Status

```bash
# List cookies
docker exec soundry_worker ls -la /app/cookies/

# Verify cookie format
docker exec soundry_worker head /app/cookies/cookie-1.txt
```

### Common Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No proxies configured" | Missing PROXY_URLS | Add environment variable |
| All proxies degraded | Rate limited | Wait 5 min or add more proxies |
| Invalid cookie format | Newlines stripped | Check cookie-service logs |
| Puppeteer crash | Memory issue | Increase container memory |

## 6. Cost Optimization

### Bandwidth Usage

- YouTube audio: ~3-10 MB per track
- At 100 tracks/day: ~500 MB - 1 GB/day
- Oxylabs cost: ~$3-15/GB (residential)

### Reducing Costs

1. Use Oxylabs sticky sessions for multi-request downloads
2. Increase cookie refresh interval if stable
3. Consider datacenter proxies for resolver (cheaper)

## 7. Security Checklist

- [ ] Cookie files in persistent volume, not image
- [ ] No credentials in logs (sanitized automatically)
- [ ] Cookie-service runs in isolated network
