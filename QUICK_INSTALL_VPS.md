# Quick VPS Installation Commands

## One-Line Installation Script

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/your-repo/chitepo/main/install-vps.sh | bash
```

Or manually run:

```bash
# Make script executable and run
chmod +x install-vps.sh
./install-vps.sh
```

## Manual Installation (Copy-Paste Ready)

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version && npm --version
```

### 3. Install MySQL 8.0
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 4. Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 5. Install Git & Build Tools
```bash
sudo apt install -y git build-essential python3
```

### 6. Install Docker (Optional)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose-plugin
sudo usermod -aG docker $USER
```

### 7. Create Project Directory
```bash
sudo mkdir -p /chitepo
sudo chown -R $USER:$USER /chitepo
cd /chitepo
```

### 8. Setup MySQL Database
```bash
sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS mindelta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mindelta_user'@'localhost' IDENTIFIED BY 'cele04';
GRANT ALL PRIVILEGES ON mindelta.* TO 'mindelta_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### 9. Install PM2
```bash
sudo npm install -g pm2
```

### 10. Configure Web Server

**Option A: Use Apache2 (if already installed)**
```bash
# Enable required modules
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo systemctl restart apache2

# Run setup script (if available)
chmod +x setup-apache2.sh
./setup-apache2.sh
```

**Option B: Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 11. Install Firewall
```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## After Installation - Project Setup

### Transfer Files to VPS
```bash
# From your local machine (Windows PowerShell)
cd C:\chitepo
scp -r * user@your-vps-ip:/chitepo/
```

### Install Project Dependencies
```bash
cd /chitepo
npm install
npm run install:all
```

### Build Project
```bash
npm run build:shared
npm run build:backend
npm run build:frontend
```

### Setup Database
```bash
npm run db:migrate
npm run db:seed  # Optional
```

### Configure Environment
```bash
# Backend
cd /chitepo/backend
nano .env  # Add your configuration

# Frontend
cd /chitepo/frontend
nano .env.local  # Add your configuration
```

### Start with PM2
```bash
cd /chitepo
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions
```

## Verify Installation

```bash
# Check services
sudo systemctl status mysql
sudo systemctl status redis-server
# Check web server (Apache2 or Nginx)
sudo systemctl status apache2  # If using Apache2
sudo systemctl status nginx     # If using Nginx
pm2 status

# Test connections
sudo redis-cli ping  # Should return "PONG"
sudo mysql -u mindelta_user -pcele04 -e "SHOW DATABASES;"
```

## Quick Service Commands

```bash
# PM2
pm2 status
pm2 logs
pm2 restart all
pm2 stop all

# MySQL
sudo systemctl restart mysql
sudo mysql -u mindelta_user -pcele04 mindelta

# Redis
sudo systemctl restart redis-server
sudo redis-cli ping

# Apache2
sudo systemctl restart apache2
sudo apache2ctl configtest  # Test configuration
sudo apache2ctl -S          # Show virtual hosts

# Nginx (if using instead of Apache2)
sudo systemctl restart nginx
sudo nginx -t  # Test configuration
```

