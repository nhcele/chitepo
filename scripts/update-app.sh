#!/bin/bash

# Application Update Script
# Safely updates the application with zero-downtime

set -e

PROJECT_DIR="/opt/chitepo"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

cd $PROJECT_DIR

echo "=========================================="
echo "Chitepo Platform - Application Update"
echo "=========================================="
echo ""

# Backup current database
echo "Step 1: Backing up database..."
mkdir -p $BACKUP_DIR
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u ${DB_USERNAME:-mindelta_user} -p${DB_PASSWORD:-changeme} ${DB_DATABASE:-mindelta} \
  > $BACKUP_DIR/pre_update_db_$DATE.sql
gzip $BACKUP_DIR/pre_update_db_$DATE.sql
echo "Database backed up to: $BACKUP_DIR/pre_update_db_$DATE.sql.gz"

# Pull latest code
echo ""
echo "Step 2: Pulling latest code..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
git pull origin $CURRENT_BRANCH

# Rebuild and restart services
echo ""
echo "Step 3: Rebuilding and restarting services..."
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "Step 4: Waiting for services to be healthy..."
sleep 10

# Run migrations
echo ""
echo "Step 5: Running database migrations..."
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# Health check
echo ""
echo "Step 6: Performing health check..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed!"
    echo "Rolling back..."
    git reset --hard HEAD@{1}
    docker compose -f docker-compose.prod.yml up -d --build
    exit 1
fi

if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend health check failed!"
    exit 1
fi

# Clean up old Docker images
echo ""
echo "Step 7: Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "=========================================="
echo "Update Complete!"
echo "=========================================="
echo ""
echo "Application updated successfully at: $(date)"
echo "Backup available at: $BACKUP_DIR/pre_update_db_$DATE.sql.gz"
echo ""
