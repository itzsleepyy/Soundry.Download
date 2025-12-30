#!/bin/bash
echo "🚀 Starting Soundry Deployment..."

# Ensure data directories exist
mkdir -p data/downloads

# Build and Start
echo "📦 Building and Starting Containers..."
docker compose up -d --build

# Wait for containers to be up (simple sleep or check)
echo "⏳ Waiting for services to initialize..."
sleep 10

# Run Migrations (via worker or api container)
echo "🔄 Running Database Migrations..."
docker compose exec -T api npx prisma migrate dev --name init

echo "✅ Deployment Complete!"
echo "frontend: http://localhost:3333"
echo "api: http://localhost:3334"
