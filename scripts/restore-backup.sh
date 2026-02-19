#!/bin/bash

# Restore from Backup Script
# Usage: ./restore-backup.sh <backup-file>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore-backup.sh <backup-file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh /opt/chitepo/backups/db_*.sql.gz
    exit 1
fi

BACKUP_FILE=$1
PROJECT_DIR="/opt/chitepo"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "=========================================="
echo "Chitepo Platform - Database Restore"
echo "=========================================="
echo ""
echo "WARNING: This will overwrite the current database!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

cd $PROJECT_DIR

# Create a safety backup of current database
echo ""
echo "Step 1: Creating safety backup of current database..."
SAFETY_BACKUP="$PROJECT_DIR/backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u ${DB_USERNAME:-mindelta_user} -p${DB_PASSWORD:-changeme} ${DB_DATABASE:-mindelta} | gzip > $SAFETY_BACKUP
echo "Safety backup created: $SAFETY_BACKUP"

# Stop backend to prevent connections
echo ""
echo "Step 2: Stopping backend..."
docker compose -f docker-compose.prod.yml stop backend

# Restore database
echo ""
echo "Step 3: Restoring database..."
gunzip < $BACKUP_FILE | docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u ${DB_USERNAME:-mindelta_user} -p${DB_PASSWORD:-changeme} ${DB_DATABASE:-mindelta}

# Start backend
echo ""
echo "Step 4: Starting backend..."
docker compose -f docker-compose.prod.yml start backend

# Wait for backend to be healthy
echo ""
echo "Step 5: Waiting for backend to be healthy..."
sleep 10

if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed!"
    echo "Attempting to restore from safety backup..."
    gunzip < $SAFETY_BACKUP | docker compose -f docker-compose.prod.yml exec -T mysql \
      mysql -u ${DB_USERNAME:-mindelta_user} -p${DB_PASSWORD:-changeme} ${DB_DATABASE:-mindelta}
    docker compose -f docker-compose.prod.yml restart backend
    exit 1
fi

echo ""
echo "=========================================="
echo "Restore Complete!"
echo "=========================================="
echo ""
echo "Database restored successfully from: $BACKUP_FILE"
echo "Safety backup available at: $SAFETY_BACKUP"
echo ""
