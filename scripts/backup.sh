#!/bin/bash

# Automated Backup Script
# Run this daily via cron: 0 2 * * * /opt/chitepo/scripts/backup.sh

set -e

PROJECT_DIR="/opt/chitepo"
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup database
echo "Backing up database..."
cd $PROJECT_DIR
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u ${DB_USERNAME:-mindelta_user} -p${DB_PASSWORD:-changeme} ${DB_DATABASE:-mindelta} \
  > $BACKUP_DIR/db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_$DATE.sql
echo "Database backup completed: db_$DATE.sql.gz"

# Backup uploaded files (if directory exists)
if [ -d "$PROJECT_DIR/uploads" ]; then
    echo "Backing up uploaded files..."
    tar -czf $BACKUP_DIR/files_$DATE.tar.gz -C $PROJECT_DIR uploads/
    echo "Files backup completed: files_$DATE.tar.gz"
fi

# Backup environment configuration
if [ -f "$PROJECT_DIR/.env.production" ]; then
    echo "Backing up environment configuration..."
    cp $PROJECT_DIR/.env.production $BACKUP_DIR/env_$DATE.backup
    echo "Environment backup completed: env_$DATE.backup"
fi

# Remove old backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "files_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_*.backup" -mtime +$RETENTION_DAYS -delete

# Calculate backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
echo "Total backup size: $BACKUP_SIZE"

echo "Backup completed successfully at $(date)"
echo "---"
