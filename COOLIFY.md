# Coolify Deployment - Quick Setup Guide

## Option 1: Simple Setup (Recommended for Coolify)

### Step 1: Environment Variables in Coolify

Set these in your Coolify project settings:

```env
# Required
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Domains (replace with your actual domains)
FRONTEND_DOMAIN=soundry.yourdomain.com
API_DOMAIN=api.soundry.yourdomain.com
```

### Step 2: Use docker-compose.prod.yml

In Coolify:
1. Go to your project settings
2. Set **Docker Compose File** to: `docker-compose.prod.yml`
3. Click **Save**
4. Click **Deploy**

### Step 3: Configure Domains in Coolify

Coolify will automatically handle SSL and routing via Traefik. Just ensure:
- Your DNS points to your Coolify server
- The domains match what you set in environment variables

---

## Option 2: Manual Configuration (If you can't use docker-compose.prod.yml)

If Coolify doesn't let you specify a custom compose file, use this approach:

### Step 1: Create a .env file in your repository

```env
# .env.production
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
API_DOMAIN=api.soundry.yourdomain.com
FRONTEND_DOMAIN=soundry.yourdomain.com
```

### Step 2: Update your main docker-compose.yml

Replace the frontend build args and environment:

```yaml
frontend:
  build:
    context: .
    dockerfile: packages/frontend/Dockerfile
    args:
      # For production, use the public API domain
      NEXT_PUBLIC_API_URL: https://${API_DOMAIN}
  environment:
    - NODE_ENV=production
    - NEXT_PUBLIC_API_URL=https://${API_DOMAIN}
```

### Step 3: Remove localhost port mappings

In production, Coolify's reverse proxy handles ports. Remove these lines:

```yaml
# Remove from api:
ports:
  - "3334:3001"

# Remove from frontend:
ports:
  - "3333:3000"

# Remove from redis:
ports:
  - "6379:6379"
```

### Step 4: Add Traefik labels

Add these labels to your frontend and api services:

```yaml
api:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.soundry-api.rule=Host(`${API_DOMAIN}`)"
    - "traefik.http.services.soundry-api.loadbalancer.server.port=3001"

frontend:
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.soundry-frontend.rule=Host(`${FRONTEND_DOMAIN}`)"
    - "traefik.http.services.soundry-frontend.loadbalancer.server.port=3000"
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to API"

**Cause:** Frontend is trying to reach `localhost:3334` but that doesn't work in containers.

**Solution:** 
- Set `NEXT_PUBLIC_API_URL` to your public API domain: `https://api.soundry.yourdomain.com`
- Make sure it's set as a **build arg** in the Dockerfile

### Issue: "CORS errors"

**Cause:** API domain doesn't match frontend domain.

**Solution:** Update your API's CORS settings in `packages/api/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'https://soundry.yourdomain.com',
    'https://api.soundry.yourdomain.com'
  ],
  credentials: true
}));
```

### Issue: "Database locked"

**Cause:** Multiple containers trying to access SQLite.

**Solution:** SQLite doesn't work well with multiple containers. For production:

1. Use PostgreSQL instead:
```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: soundry
    POSTGRES_USER: soundry
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

2. Update DATABASE_URL:
```env
DATABASE_URL=postgresql://soundry:${POSTGRES_PASSWORD}@postgres:5432/soundry
```

---

## Testing Your Deployment

1. **Check API Health:**
   ```bash
   curl https://api.soundry.yourdomain.com/health
   # Should return: {"status":"ok"}
   ```

2. **Check Frontend:**
   - Visit: `https://soundry.yourdomain.com`
   - Should load the homepage

3. **Test Download:**
   - Paste a Spotify URL
   - Check the library for progress

---

## Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | `abc123...` | Spotify API Client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | `xyz789...` | Spotify API Client Secret |
| `API_DOMAIN` | Yes | `api.soundry.com` | Public API domain |
| `FRONTEND_DOMAIN` | Yes | `soundry.com` | Public frontend domain |
| `DATABASE_URL` | No | `file:/app/data/soundry.db` | Database connection string |
| `REDIS_URL` | No | `redis://redis:6379` | Redis connection string |
| `NODE_ENV` | No | `production` | Node environment |

---

## Next Steps

1. ✅ Deploy to Coolify
2. ✅ Configure domains
3. ✅ Test functionality
4. 📊 Set up monitoring (optional)
5. 💾 Configure backups (recommended)

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
