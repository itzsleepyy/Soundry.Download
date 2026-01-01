# Railway Deployment Guide for Soundry

## Important: Docker Compose on Railway

Railway's docker-compose support works differently than standard deployment:
- Each service in docker-compose becomes a **separate Railway service**
- The `.railway.yml` file maps services from docker-compose
- You'll have 4 services: API, Worker, Frontend, Redis

## Quick Start (10 minutes)

### 1. Push Code to GitHub
```bash
git add -A
git commit -m "Railway configuration"
git push origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select `Soundry.Download`
5. **Important**: Railway will create 4 separate services from your docker-compose

### 3. Configure Each Service

Railway will create these services automatically:

#### Service 1: Redis
- **Type**: Database → Redis
- **No configuration needed** - Railway provides this automatically
- Note the internal URL (e.g., `redis://redis.railway.internal:6379`)

#### Service 2: API
- **Build Command**: Automatic (uses Dockerfile)
- **Start Command**: Automatic
- **Environment Variables**:
  ```
  PORT=3001
  DATABASE_URL=file:/app/data/soundry.db
  REDIS_URL=${{Redis.REDIS_URL}}  # Railway magic variable
  DOWNLOADS_DIR=/app/data/downloads
  NODE_ENV=production
  SPOTIFY_CLIENT_ID=<your_spotify_client_id>
  SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
  ```
- **Public Networking**: Enable
- **Domain**: Will generate like `api-production-xxxx.up.railway.app`

#### Service 3: Worker
- **Build Command**: Automatic (uses Dockerfile)
- **Start Command**: Automatic
- **Environment Variables**:
  ```
  DATABASE_URL=file:/app/data/soundry.db
  REDIS_URL=${{Redis.REDIS_URL}}
  DOWNLOADS_DIR=/app/data/downloads
  COOKIES_DIR=/app/cookies
  NODE_ENV=production
  WORKER_CONCURRENCY=10
  SPOTIFY_CLIENT_ID=<your_spotify_client_id>
  SPOTIFY_CLIENT_SECRET=<your_spotify_client_secret>
  YOUTUBE_COOKIE_1=<paste_full_cookie_file_content>
  ```
- **Replicas**: Set to **5** (for 50 concurrent jobs)
- **Public Networking**: Disable (internal only)

#### Service 4: Frontend
- **Build Command**: Automatic (uses Dockerfile)
- **Build Args**:
  ```
  NEXT_PUBLIC_API_URL=https://your-api-domain.up.railway.app
  ```
- **Environment Variables**:
  ```
  NODE_ENV=production
  NEXT_PUBLIC_API_URL=https://your-api-domain.up.railway.app
  ```
- **Public Networking**: Enable
- **Custom Domain**: `soundry.download` (add in settings)

---

## Scaling Workers

### Method 1: Railway UI
1. Go to your Worker service
2. Click "Settings"
3. Find "Replicas" section
4. Set to `5` (or any number you want)
5. Click "Deploy"

### Method 2: railway.toml (Advanced)
Create a `railway.toml` in your repo:

```toml
[build]
builder = "NIXPACKS"

[deploy]
numReplicas = 5
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## Custom Domain Setup

### 1. Configure Frontend Domain
1. In Railway, select your Frontend service
2. Go to "Settings" → "Networking"
3. Click "Custom Domain"
4. Add `soundry.download`
5. Railway will provide CNAME/A records

### 2. Configure API Domain
1. Select API service
2. Add custom domain: `api.soundry.download`
3. Copy DNS records

### 3. Update DNS (Your Domain Registrar)
Add these records at your domain provider:

```
Type: CNAME
Name: @
Value: <frontend-railway-url>

Type: CNAME  
Name: api
Value: <api-railway-url>
```

---

## Persistent Storage (Important!)

Railway provides ephemeral storage by default. For persistent data:

### Option 1: Railway Volumes (Recommended)
1. In Worker service, go to "Data" tab
2. Click "New Volume"
3. Mount path: `/app/data`
4. Size: 10GB (or whatever you need)

### Option 2: External Storage
Use an external database service like:
- **PostgreSQL** (Railway provides this)
- **S3** for downloads storage

---

## Environment Variables Reference

### Required for All Services:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

### Worker-Specific:
- `WORKER_CONCURRENCY=10` (per instance)
- `YOUTUBE_COOKIE_1` (optional but recommended)
- `YOUTUBE_COOKIE_2` (optional, for rotation)

### Frontend-Specific:
- `NEXT_PUBLIC_API_URL` (must match API domain)

---

## Cost Estimate

Based on your setup with 5 workers:

| Resource | Cost |
|----------|------|
| Starter Plan | $5/month |
| Compute (5 workers + API + Frontend) | ~$15-25/month |
| Redis | Included |
| Egress/Transfer | ~$5/month |
| **Total** | **~$25-35/month** |

*Railway charges $0.000231/GB-hour for compute*

---

## Deployment Steps

1. **Push to GitHub**: Commit all changes
   ```bash
   git add -A
   git commit -m "Railway deployment configuration"
   git push origin main
   ```

2. **Create Railway Project**: 
   - Link GitHub repo
   - Railway auto-detects services

3. **Add Environment Variables**:
   - Add all variables listed above to each service

4. **Scale Workers**:
   - Set Worker replicas to 5

5. **Configure Domains**:
   - Add custom domains
   - Update DNS records

6. **Deploy**:
   - Railway auto-deploys on git push
   - Monitor logs for any issues

7. **Test**:
   - Visit `soundry.download`
   - Submit a download
   - Check worker logs to verify scaling

---

## Monitoring

### Logs
- Click any service → "Logs" tab
- Real-time streaming logs
- Filter by service

### Metrics
- Railway provides CPU/Memory graphs
- Monitor worker utilization
- Set up alerts for high usage

---

## Troubleshooting

### Workers not scaling?
- Check "Replicas" setting in Worker service
- Verify REDIS_URL is correctly set
- Check logs for connection errors

### Database issues?
- Ensure volumes are mounted correctly
- Check DATABASE_URL points to volume path

### High costs?
- Reduce worker replicas
- Lower WORKER_CONCURRENCY
- Monitor egress bandwidth

---

## Next Steps

1. Remove announcement banner once deployed
2. Monitor performance for first week
3. Adjust worker replicas based on load
4. Set up monitoring/alerts
5. Configure automated backups

Need help with any step? Let me know!
