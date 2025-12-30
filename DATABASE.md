# Database Setup for Coolify

## The Problem
When you first deploy, the database tables don't exist yet. You'll see this error:
```
The table `main.Track` does not exist in the current database.
```

## The Solution

### Automatic (Recommended) ✅
I've updated the API to automatically run migrations on startup.

**Just redeploy and it will work!**

The API now runs this before starting:
```bash
npx prisma migrate deploy
```

### Manual (If needed)

If you need to run migrations manually:

#### Option 1: Via Coolify Terminal
1. Go to Coolify → Your Project → **API Service**
2. Click **"Terminal"** or **"Execute Command"**
3. Run:
   ```bash
   npx prisma migrate deploy
   ```

#### Option 2: Via Docker
```bash
# Find the API container
docker ps | grep soundry

# Run migration
docker exec -it <api-container-name> npx prisma migrate deploy
```

#### Option 3: Via Coolify SSH
```bash
# SSH into your Coolify server
ssh user@your-server.com

# Run migration
docker exec -it $(docker ps -q -f name=soundry.*api) npx prisma migrate deploy
```

## What Gets Created

The migration creates these tables:
- `Track` - Downloaded tracks
- `TrackFile` - File formats (mp3, flac, wav)
- `SessionItem` - User session history
- `SessionGroup` - Playlist/album groups

## Verification

After running migrations, check the logs:
```bash
# API logs should show:
✓ Database migrations completed
✓ Server started on port 3001
```

## Database Location

The SQLite database is stored at:
```
/app/data/soundry.db
```

This is persisted in the `soundry-data` Docker volume.

## Resetting the Database

If you need to start fresh:

```bash
# Stop containers
docker-compose down

# Remove volume
docker volume rm soundry-data

# Restart
docker-compose up -d

# Migrations will run automatically
```

## Troubleshooting

### Error: "Migration failed"
**Solution:** Check that the volume is writable:
```bash
docker exec -it <api-container> ls -la /app/data
```

### Error: "Database is locked"
**Solution:** Only one process should access SQLite. Make sure:
- Only one API container is running
- No manual connections are open

### Error: "Prisma schema not found"
**Solution:** The Dockerfile should copy the prisma folder. Check:
```dockerfile
COPY prisma ./prisma
RUN npx prisma generate
```

## Upgrading Schema

When you update the Prisma schema:

1. **Create migration locally:**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Commit the migration:**
   ```bash
   git add prisma/migrations
   git commit -m "Add migration: your_migration_name"
   git push
   ```

3. **Redeploy in Coolify**
   - The startup script will automatically apply new migrations

## Production Considerations

For production with high traffic, consider PostgreSQL instead of SQLite:

```yaml
# docker-compose.prod.yml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: soundry
    POSTGRES_USER: soundry
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

Update `DATABASE_URL`:
```env
DATABASE_URL=postgresql://soundry:${POSTGRES_PASSWORD}@postgres:5432/soundry
```

PostgreSQL benefits:
- Better concurrency
- No file locking issues
- Better performance at scale
- Built-in backups
