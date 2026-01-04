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
