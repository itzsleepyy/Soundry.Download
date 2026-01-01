# Worker Scaling Guide

## Issue
Coolify doesn't support the `deploy.replicas` syntax in docker-compose.yml. You need to scale manually.

## How to Scale Workers

### Option 1: Via Coolify UI
1. Go to your Soundry application in Coolify
2. Find the "Worker" service
3. Look for **Scale/Replicas** setting
4. Set to `3` (or any number you want)
5. Redeploy

### Option 2: Via Command Line (SSH)
If Coolify doesn't have UI scaling:

```bash
# SSH to your server
ssh your-server

# Navigate to project directory
cd /path/to/soundry

# Scale workers to 3 instances
docker compose up -d --scale worker=3

# Verify
docker ps | grep worker
# You should see: worker-1, worker-2, worker-3
```

### Option 3: Environment Variable (If Supported)
Some platforms support:
```env
WORKER_REPLICAS=3
```

Check your Coolify docs to see if this is available.

## Current Configuration
- **Concurrency per worker**: 10 jobs
- **Desired workers**: 3
- **Total capacity**: 30 concurrent downloads

## To Scale Up/Down
Just change the number:
```bash
docker compose up -d --scale worker=5  # 50 concurrent jobs
docker compose up -d --scale worker=1  # Back to 10
```
