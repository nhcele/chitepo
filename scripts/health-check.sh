#!/bin/bash

# Health Check and Auto-Recovery Script
# Run this every 5 minutes via cron: */5 * * * * /opt/chitepo/scripts/health-check.sh

PROJECT_DIR="/opt/chitepo"
LOG_FILE="$PROJECT_DIR/health-check.log"
MAX_LOG_SIZE=10485760  # 10MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
    mv $LOG_FILE $LOG_FILE.old
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

cd $PROJECT_DIR

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "ERROR: Docker is not running!"
    systemctl restart docker
    sleep 10
fi

# Check if containers are running
RUNNING_CONTAINERS=$(docker compose -f docker-compose.prod.yml ps --services --filter "status=running" | wc -l)
EXPECTED_CONTAINERS=5  # mysql, redis, minio, backend, frontend

if [ $RUNNING_CONTAINERS -lt $EXPECTED_CONTAINERS ]; then
    log "WARNING: Only $RUNNING_CONTAINERS/$EXPECTED_CONTAINERS containers running. Restarting..."
    docker compose -f docker-compose.prod.yml up -d
    sleep 30
fi

# Check backend health
if ! curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    log "ERROR: Backend health check failed. Restarting backend..."
    docker compose -f docker-compose.prod.yml restart backend
    sleep 20
    
    # Check again
    if ! curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        log "CRITICAL: Backend still unhealthy after restart!"
        # Send alert (implement your notification method)
    else
        log "INFO: Backend recovered successfully"
    fi
fi

# Check frontend
if ! curl -f -s http://localhost:3001 > /dev/null 2>&1; then
    log "ERROR: Frontend health check failed. Restarting frontend..."
    docker compose -f docker-compose.prod.yml restart frontend
    sleep 20
    
    # Check again
    if ! curl -f -s http://localhost:3001 > /dev/null 2>&1; then
        log "CRITICAL: Frontend still unhealthy after restart!"
        # Send alert (implement your notification method)
    else
        log "INFO: Frontend recovered successfully"
    fi
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    log "WARNING: Disk usage is at ${DISK_USAGE}%"
    # Clean up Docker
    docker system prune -f > /dev/null 2>&1
    log "INFO: Docker cleanup performed"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ $MEMORY_USAGE -gt 90 ]; then
    log "WARNING: Memory usage is at ${MEMORY_USAGE}%"
fi

# All checks passed
log "INFO: All health checks passed. System healthy."
