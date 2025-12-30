# Deploying Soundry to Coolify

This guide walks you through deploying Soundry.Download to Coolify, a self-hosted platform-as-a-service.

## Prerequisites

- A Coolify instance (self-hosted or managed)
- A GitHub/GitLab repository with your code
- Spotify API credentials (Client ID & Secret)
- Domain name (optional, but recommended)

## Architecture Overview

Soundry consists of 4 services:
- **Frontend** (Next.js) - Port 3000
- **API** (Node.js/Express) - Port 3001
- **Worker** (Node.js/BullMQ) - Background job processor
- **Redis** - Message queue

## Step-by-Step Deployment

### 1. Push Your Code to Git

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Create a New Project in Coolify

1. Log into your Coolify dashboard
2. Click **"+ New"** → **"Resource"**
3. Select **"Docker Compose"**
4. Choose your Git provider and repository
5. Select the branch (e.g., `main`)

### 3. Configure Docker Compose

Coolify will automatically detect your `docker-compose.yml`. You need to make a few adjustments:

#### Option A: Use Coolify's Built-in Services

Create a new `docker-compose.coolify.yml` in your repo:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: packages/api/Dockerfile
    environment:
      - NODE_ENV=production
      - PORT=3001
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=file:/app/data/soundry.db
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - DOWNLOADS_DIR=/app/data/downloads
    volumes:
      - soundry-data:/app/data
    depends_on:
      - redis
    labels:
      - "coolify.managed=true"

  worker:
    build:
      context: .
      dockerfile: packages/worker/Dockerfile
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=file:/app/data/soundry.db
      - DOWNLOADS_DIR=/app/data/downloads
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
    volumes:
      - soundry-data:/app/data
    depends_on:
      - redis
    labels:
      - "coolify.managed=true"

  frontend:
    build:
      context: .
      dockerfile: packages/frontend/Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    depends_on:
      - api
    labels:
      - "coolify.managed=true"
      - "traefik.enable=true"
      - "traefik.http.routers.soundry-frontend.rule=Host(`${DOMAIN}`)"
      - "traefik.http.services.soundry-frontend.loadbalancer.server.port=3000"

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    labels:
      - "coolify.managed=true"

volumes:
  soundry-data:
  redis-data:
```

#### Option B: Modify Existing docker-compose.yml

Update your existing `docker-compose.yml` to work with Coolify's reverse proxy (Traefik):

1. Remove port mappings (Coolify handles this)
2. Add Traefik labels for the frontend
3. Use environment variables for configuration

### 4. Set Environment Variables in Coolify

In your Coolify project settings, add these environment variables:

**Required:**
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DOMAIN=yourdomain.com
```

**Optional (with defaults):**
```env
NODE_ENV=production
DATABASE_URL=file:/app/data/soundry.db
REDIS_URL=redis://redis:6379
DOWNLOADS_DIR=/app/data/downloads
```

### 5. Configure Domains

In Coolify, set up your domains:

1. **Frontend**: `yourdomain.com` → `frontend:3000`
2. **API**: `api.yourdomain.com` → `api:3001`

Coolify will automatically provision SSL certificates via Let's Encrypt.

### 6. Configure Persistent Storage

Ensure the `soundry-data` volume is persistent:

1. Go to **Volumes** in your Coolify project
2. Find `soundry-data`
3. Enable **"Persistent"** to survive container restarts
4. Optionally, configure backups

### 7. Deploy

1. Click **"Deploy"** in Coolify
2. Monitor the build logs
3. Wait for all services to start (green status)

### 8. Run Database Migrations

After first deployment, run migrations:

1. Go to **Services** → **api**
2. Click **"Execute Command"**
3. Run:
```bash
npx prisma migrate deploy
```

## Post-Deployment

### Verify Services

Check that all services are running:
- Frontend: `https://yourdomain.com`
- API: `https://api.yourdomain.com/health` (should return `{"status":"ok"}`)

### Test Functionality

1. Visit your frontend URL
2. Paste a Spotify track URL
3. Request a download
4. Check the library to see progress

### Monitor Logs

In Coolify:
1. Go to **Logs** tab
2. Select service (api/worker/frontend)
3. Monitor for errors

## Troubleshooting

### Issue: "Cannot connect to API"

**Solution:** Ensure `NEXT_PUBLIC_API_URL` is set correctly and includes `https://`

### Issue: "Spotify API errors"

**Solution:** Verify your Spotify credentials are correct and the app is not in development mode

### Issue: "Downloads not processing"

**Solution:** 
1. Check worker logs for errors
2. Verify Redis is running: `redis-cli ping` should return `PONG`
3. Ensure volumes are mounted correctly

### Issue: "Database locked errors"

**Solution:** SQLite doesn't handle high concurrency well. For production, consider PostgreSQL:

```yaml
# Add to docker-compose.coolify.yml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: soundry
    POSTGRES_USER: soundry
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data

# Update DATABASE_URL in api and worker:
DATABASE_URL=postgresql://soundry:${POSTGRES_PASSWORD}@postgres:5432/soundry
```

## Scaling

### Horizontal Scaling

To handle more traffic, scale the worker:

1. In Coolify, go to **Services** → **worker**
2. Increase **"Replicas"** to 2-5
3. Each worker will process jobs from the shared Redis queue

### Vertical Scaling

Increase resources for services:

1. Go to **Service Settings**
2. Adjust **CPU** and **Memory** limits
3. Recommended:
   - Frontend: 512MB RAM, 0.5 CPU
   - API: 1GB RAM, 1 CPU
   - Worker: 2GB RAM, 1 CPU (needs more for ffmpeg)
   - Redis: 512MB RAM, 0.5 CPU

## Backup Strategy

### Database Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh
docker exec soundry-api-1 sqlite3 /app/data/soundry.db ".backup /app/data/backup-$(date +%Y%m%d).db"
```

Schedule with cron or Coolify's scheduled tasks.

### Volume Backups

Use Coolify's built-in backup feature:
1. Go to **Volumes** → **soundry-data**
2. Enable **"Backup"**
3. Set schedule (daily recommended)
4. Configure backup destination (S3, local, etc.)

## Performance Optimization

### Enable Caching

Add Redis caching for API responses:

```javascript
// In packages/api/src/index.js
const cache = require('express-redis-cache')({
  client: redisClient,
  expire: 60 // 1 minute
});

apiRouter.get('/library/global', cache.route(), async (req, res) => {
  // ... existing code
});
```

### CDN for Static Assets

Configure Coolify to serve frontend static assets via CDN:
1. Use Cloudflare or similar
2. Point to your frontend domain
3. Enable caching for `/_next/static/*`

## Security Checklist

- ✅ SSL certificates enabled (automatic with Coolify)
- ✅ Environment variables secured (not in git)
- ✅ API rate limiting enabled
- ✅ CORS configured properly
- ✅ Database backups scheduled
- ✅ Logs monitored for suspicious activity

## Cost Estimation

For a small-to-medium deployment:
- **Server**: $10-20/month (2GB RAM, 2 CPU)
- **Domain**: $10-15/year
- **Coolify**: Free (self-hosted) or $5-10/month (managed)
- **Total**: ~$15-30/month

## Support

For issues:
1. Check Coolify logs first
2. Review this deployment guide
3. Check GitHub issues
4. Contact support

## Updates

To update your deployment:

1. Push changes to your git repository
2. In Coolify, click **"Redeploy"**
3. Monitor build logs
4. Run migrations if schema changed

---

**Next Steps:**
- Set up monitoring (Uptime Kuma, Grafana)
- Configure automated backups
- Set up staging environment
- Implement CI/CD pipeline
