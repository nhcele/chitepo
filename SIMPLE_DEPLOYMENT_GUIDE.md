# Simplified Deployment Guide - Single VPS Setup

This guide provides a **simple, production-ready deployment** for a single VPS without Kubernetes or complex infrastructure.

## 🎯 Overview

**What You Need:**
- 1 VPS with 4GB+ RAM (DigitalOcean, Linode, Vultr, etc.)
- Ubuntu 22.04 LTS
- A domain name pointed to your VPS IP
- 30 minutes of setup time

**What You Get:**
- Production-ready deployment with Docker Compose
- Automatic SSL certificates (Let's Encrypt)
- Automatic restarts and health checks
- Simple backup system
- Easy updates and rollbacks

---

## 📋 Quick Start (5 Commands)

```bash
# 1. Clone your project
git clone <your-repo-url> /opt/chitepo && cd /opt/chitepo

# 2. Run the automated setup script
chmod +x scripts/simple-deploy.sh
sudo ./scripts/simple-deploy.sh

# 3. Configure your environment
cp .env.example .env.production
nano .env.production  # Edit with your settings

# 4. Start the application
docker compose -f docker-compose.prod.yml up -d

# 5. Setup SSL (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**That's it!** Your application is now running with HTTPS.

---

## 🚀 Detailed Setup Instructions

### Step 1: Prepare Your VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl git ufw

# Configure firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### Step 2: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Step 3: Clone and Configure

```bash
# Clone project to /opt/chitepo
sudo mkdir -p /opt/chitepo
sudo chown $USER:$USER /opt/chitepo
cd /opt/chitepo
git clone <your-repo-url> .

# Create production environment file
cp .env.example .env.production
nano .env.production
```

**Edit `.env.production` with your settings:**

```env
# Application
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com

# Database (use strong passwords!)
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=mindelta_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
DB_DATABASE=mindelta

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING
JWT_EXPIRES_IN=7d

# Email (use your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Optional: AI Features (can disable initially)
# OPENAI_API_KEY=your-key-here
# PINECONE_API_KEY=your-key-here

# Optional: AWS (can use MinIO instead)
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
```

### Step 4: Start Application

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy (30-60 seconds)
docker compose -f docker-compose.prod.yml ps

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate

# (Optional) Seed initial data
docker compose -f docker-compose.prod.yml exec backend npm run db:seed
```

### Step 5: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/chitepo
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 100M;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/chitepo /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically:
# - Obtain SSL certificate
# - Configure Nginx for HTTPS
# - Set up auto-renewal
```

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## 🔧 Daily Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend
```

### Update Application

```bash
cd /opt/chitepo

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### Check Status

```bash
# Service status
docker compose -f docker-compose.prod.yml ps

# Resource usage
docker stats

# Disk space
df -h
```

---

## 💾 Backup System

### Automated Daily Backups

```bash
# Create backup script
sudo nano /opt/chitepo/backup.sh
```

**Add this script:**

```bash
#!/bin/bash
BACKUP_DIR="/opt/chitepo/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose -f /opt/chitepo/docker-compose.prod.yml exec -T mysql \
  mysqldump -u mindelta_user -p$DB_PASSWORD mindelta > $BACKUP_DIR/db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x /opt/chitepo/backup.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/chitepo/backup.sh") | crontab -
```

### Manual Backup

```bash
# Backup database
docker compose -f docker-compose.prod.yml exec mysql \
  mysqldump -u mindelta_user -p mindelta > backup_$(date +%Y%m%d).sql

# Backup uploaded files (if any)
tar -czf files_backup_$(date +%Y%m%d).tar.gz uploads/
```

### Restore from Backup

```bash
# Restore database
docker compose -f docker-compose.prod.yml exec -T mysql \
  mysql -u mindelta_user -p mindelta < backup_20240102.sql
```

---

## 🔍 Monitoring & Health Checks

### Simple Health Check Script

```bash
# Create health check script
nano /opt/chitepo/health-check.sh
```

```bash
#!/bin/bash

# Check if services are running
if ! docker compose -f /opt/chitepo/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "ERROR: Services are down!"
    docker compose -f /opt/chitepo/docker-compose.prod.yml up -d
fi

# Check backend health
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "ERROR: Backend health check failed!"
    docker compose -f /opt/chitepo/docker-compose.prod.yml restart backend
fi

# Check frontend
if ! curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "ERROR: Frontend health check failed!"
    docker compose -f /opt/chitepo/docker-compose.prod.yml restart frontend
fi
```

```bash
# Make executable
chmod +x /opt/chitepo/health-check.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/chitepo/health-check.sh") | crontab -
```

---

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep -E ':(3000|3001|3306|6379)'

# Restart everything
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Database Connection Issues

```bash
# Check MySQL is running
docker compose -f docker-compose.prod.yml ps mysql

# Check MySQL logs
docker compose -f docker-compose.prod.yml logs mysql

# Connect to MySQL directly
docker compose -f docker-compose.prod.yml exec mysql \
  mysql -u mindelta_user -p mindelta
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean up old logs
sudo journalctl --vacuum-time=7d
```

### High Memory Usage

```bash
# Check memory
free -h

# Check which containers use most memory
docker stats --no-stream

# Restart services to free memory
docker compose -f docker-compose.prod.yml restart
```

---

## 📊 Cost Comparison

### This Simple Setup
- **VPS**: $12-24/month (4-8GB RAM)
- **Domain**: $12/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$15-25/month

### Complex K8s Setup (Previous)
- **EKS Cluster**: $72/month (control plane)
- **Worker Nodes**: $60-120/month (2-3 nodes)
- **Load Balancer**: $18/month
- **RDS Database**: $30-100/month
- **Other AWS Services**: $50+/month
- **Total**: ~$230-360/month

**Savings: $200-335/month (92% reduction)**

---

## 🎯 When to Upgrade

You should consider more complex infrastructure when:

- ✅ You have **10,000+ active users**
- ✅ You need **99.99% uptime SLA**
- ✅ You have **multiple regions** requirement
- ✅ You have **dedicated DevOps team**
- ✅ You have **budget for $500+/month** hosting

Until then, this simple setup will serve you well!

---

## 🔐 Security Checklist

- [ ] Changed all default passwords in `.env.production`
- [ ] Generated strong JWT secret
- [ ] Configured firewall (UFW)
- [ ] Enabled SSL/HTTPS
- [ ] Set up automated backups
- [ ] Configured health checks
- [ ] Disabled root SSH login
- [ ] Set up SSH keys (disable password auth)
- [ ] Keep system updated (`apt update && apt upgrade`)
- [ ] Monitor logs regularly

---

## 📚 Additional Resources

### Useful Commands

```bash
# View all running containers
docker ps

# Stop all services
docker compose -f docker-compose.prod.yml down

# View resource usage
docker stats

# Clean up unused resources
docker system prune

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Tuning

For better performance on a single VPS:

```bash
# Edit docker-compose.prod.yml to limit resources
# Add under each service:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 🎉 Summary

You now have a **production-ready deployment** that is:

✅ **Simple** - No Kubernetes complexity  
✅ **Affordable** - $15-25/month vs $230+/month  
✅ **Reliable** - Automatic restarts and health checks  
✅ **Secure** - HTTPS, firewall, automated backups  
✅ **Maintainable** - Easy updates and monitoring  

**Perfect for:**
- MVP launches
- Small to medium applications
- Budget-conscious projects
- Teams without dedicated DevOps

**Scales to:**
- 1,000-10,000 concurrent users
- 100,000+ registered users
- Millions of requests per month

When you outgrow this setup, you'll have the revenue and team to justify more complex infrastructure!
