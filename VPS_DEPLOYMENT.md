# VPS Deployment Guide for Chitepo Project

This guide provides step-by-step commands to deploy the Chitepo project on a Linux VPS in the `/chitepo` directory.

## Prerequisites

- Linux VPS (Ubuntu/Debian recommended)
- Root or sudo access
- SSH access to the VPS

## Step 1: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

## Step 2: Install System Dependencies

### Install Node.js 18.x (LTS)

```bash
# Install Node.js 18.x using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

### Install MySQL 8.0

```bash
# Install MySQL server
sudo apt install -y mysql-server

# Secure MySQL installation (optional but recommended)
sudo mysql_secure_installation

# Start and enable MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify MySQL is running
sudo systemctl status mysql
```

### Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis to start on boot
sudo systemctl enable redis-server

# Start Redis service
sudo systemctl start redis-server

# Verify Redis is running
sudo systemctl status redis-server
sudo redis-cli ping  # Should return "PONG"
```

### Install Git

```bash
sudo apt install -y git
```

### Install Build Tools (for native modules)

```bash
sudo apt install -y build-essential python3
```

### Install Docker and Docker Compose (Optional - for containerized deployment)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (replace $USER with your username)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Note:** After adding user to docker group, you may need to log out and log back in.

## Step 3: Create Project Directory

```bash
# Create the /chitepo directory
sudo mkdir -p /chitepo

# Set ownership (replace 'your-username' with your actual username)
sudo chown -R $USER:$USER /chitepo

# Navigate to the directory
cd /chitepo
```

## Step 4: Transfer Project Files

### Option A: Using Git (if project is in a repository)

```bash
cd /chitepo
git clone <your-repository-url> .
```

### Option B: Using SCP from your local machine

From your local Windows machine, run:
```powershell
# Navigate to your project directory
cd C:\chitepo

# Transfer files to VPS (replace with your VPS details)
scp -r * user@your-vps-ip:/chitepo/
```

### Option C: Using rsync (if available)

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' /path/to/local/chitepo/ user@your-vps-ip:/chitepo/
```

## Step 5: Install Node.js Dependencies

```bash
cd /chitepo

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all

# Or install individually:
# npm run install:shared
# npm run install:backend
# npm run install:frontend
```

## Step 6: Database Setup

### Create MySQL Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# Run these SQL commands:
```

```sql
CREATE DATABASE mindelta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mindelta_user'@'localhost' IDENTIFIED BY 'cele04';
GRANT ALL PRIVILEGES ON mindelta.* TO 'mindelta_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Database Migrations

```bash
cd /chitepo

# Run migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed
```

## Step 7: Environment Configuration

### Create Backend Environment File

```bash
cd /chitepo/backend
nano .env
```

Add the following configuration (adjust values as needed):

```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=mindelta_user
DB_PASSWORD=cele04
DB_DATABASE=mindelta

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AWS S3 (or MinIO)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@mindelta.com

# Frontend URL
FRONTEND_URL=http://your-domain.com
```

### Create Frontend Environment File

```bash
cd /chitepo/frontend
nano .env.local
```

Add the following:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://your-domain.com
```

## Step 8: Build the Project

```bash
cd /chitepo

# Build shared package first
npm run build:shared

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

## Step 9: Install Process Manager (PM2) for Production

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 ecosystem file
cd /chitepo
nano ecosystem.config.js
```

Add the following PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'chitepo-backend',
      cwd: '/chitepo/backend',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/chitepo/logs/backend-error.log',
      out_file: '/chitepo/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'chitepo-frontend',
      cwd: '/chitepo/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/chitepo/logs/frontend-error.log',
      out_file: '/chitepo/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
```

```bash
# Create logs directory
mkdir -p /chitepo/logs

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 10: Configure Web Server (Reverse Proxy)

You can use either Apache2 (already installed) or Nginx. Choose one option below.

### Option A: Apache2 Configuration (Recommended if Apache2 is already installed)

```bash
# Enable required Apache modules for reverse proxy
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl

# Fix the ServerName warning
echo "ServerName localhost" | sudo tee /etc/apache2/conf-available/servername.conf
sudo a2enconf servername

# Create Apache virtual host for backend API
sudo nano /etc/apache2/sites-available/chitepo-api.conf
```

Add the following configuration:

```apache
<VirtualHost *:80>
    ServerName api.your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Backend API
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Headers
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/chitepo-api-error.log
    CustomLog ${APACHE_LOG_DIR}/chitepo-api-access.log combined
</VirtualHost>
```

```bash
# Create Apache virtual host for frontend
sudo nano /etc/apache2/sites-available/chitepo-frontend.conf
```

Add the following configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Frontend
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:3001/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*) http://localhost:3001/$1 [P,L]
    
    # Headers
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/chitepo-frontend-error.log
    CustomLog ${APACHE_LOG_DIR}/chitepo-frontend-access.log combined
</VirtualHost>
```

```bash
# Enable the sites
sudo a2ensite chitepo-api.conf
sudo a2ensite chitepo-frontend.conf

# Disable default site (optional)
sudo a2dissite 000-default.conf

# Test Apache configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2

# Verify Apache is running
sudo systemctl status apache2
```

### Option B: Nginx Configuration (Alternative)

If you prefer Nginx or want to switch from Apache2:

```bash
# Stop Apache2 (if you want to use Nginx instead)
sudo systemctl stop apache2
sudo systemctl disable apache2

# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/chitepo
```

Add the following configuration:

```nginx
# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
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

# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/chitepo /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

## Step 11: Configure Firewall

```bash
# Install UFW (if not already installed)
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check firewall status
sudo ufw status
```

## Step 12: Install SSL Certificate (Let's Encrypt)

### If using Apache2:

```bash
# Install Certbot with Apache plugin
sudo apt install -y certbot python3-certbot-apache

# Obtain SSL certificate (Certbot will automatically configure Apache)
sudo certbot --apache -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Certbot will automatically configure Apache and set up auto-renewal
```

### If using Nginx:

```bash
# Install Certbot with Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (Certbot will automatically configure Nginx)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

**Note:** Certbot will automatically:
- Obtain SSL certificates from Let's Encrypt
- Configure your web server for HTTPS
- Set up automatic renewal
- Redirect HTTP to HTTPS

## Step 13: Verify Installation

```bash
# Check Node.js processes
pm2 status

# Check MySQL
sudo systemctl status mysql

# Check Redis
sudo systemctl status redis-server
sudo redis-cli ping

# Check Web Server (Apache2 or Nginx)
# If using Apache2:
sudo systemctl status apache2
sudo apache2ctl -S  # Show virtual hosts

# If using Nginx:
sudo systemctl status nginx
sudo nginx -t  # Test configuration

# View application logs
pm2 logs chitepo-backend
pm2 logs chitepo-frontend

# Test backend API
curl http://localhost:3000/health

# Test frontend
curl http://localhost:3001
```

## Useful Commands

### PM2 Management
```bash
pm2 status              # Check application status
pm2 logs                # View all logs
pm2 restart all         # Restart all applications
pm2 stop all            # Stop all applications
pm2 delete all          # Delete all applications
pm2 monit               # Monitor applications
```

### Database Management
```bash
# Access MySQL
sudo mysql -u mindelta_user -p mindelta

# Run migrations
cd /chitepo && npm run db:migrate

# Run seeds
cd /chitepo && npm run db:seed
```

### Service Management
```bash
# MySQL
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql

# Redis
sudo systemctl start redis-server
sudo systemctl stop redis-server
sudo systemctl restart redis-server

# Apache2
sudo systemctl start apache2
sudo systemctl stop apache2
sudo systemctl restart apache2
sudo apache2ctl configtest  # Test configuration
sudo apache2ctl -S          # Show virtual hosts

# Nginx (if using instead of Apache2)
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo nginx -t  # Test configuration
```

## Troubleshooting

### Check Port Availability
```bash
sudo netstat -tulpn | grep LISTEN
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

### View System Logs
```bash
sudo journalctl -xe
```

## Alternative: Docker Deployment

If you prefer to use Docker, you can use the provided `docker-compose.yml`:

```bash
cd /chitepo

# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Security Recommendations

1. **Change default passwords** in `.env` files
2. **Use strong JWT secrets** (generate with: `openssl rand -base64 32`)
3. **Configure firewall** properly
4. **Keep system updated**: `sudo apt update && sudo apt upgrade`
5. **Use SSH keys** instead of passwords
6. **Regular backups** of database and files
7. **Monitor logs** regularly
8. **Use HTTPS** in production

## Backup Script

Create a backup script:

```bash
nano /chitepo/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/chitepo/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u mindelta_user -pcele04 mindelta > $BACKUP_DIR/db_backup_$DATE.sql

# Backup files (excluding node_modules)
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz --exclude='node_modules' --exclude='.git' /chitepo

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable:
```bash
chmod +x /chitepo/backup.sh
```

Add to crontab for daily backups:
```bash
crontab -e
# Add: 0 2 * * * /chitepo/backup.sh
```

