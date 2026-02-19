#!/bin/bash

# Quick Start Script for Chitepo VPS Deployment
# This script provides a quick way to set up the Chitepo project on a VPS

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Chitepo Project - Quick Start"
echo "==========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root.${NC}"
    echo "The script will use sudo when needed."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found.${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo -e "${YELLOW}This script will:${NC}"
echo "  1. Install system dependencies (if needed)"
echo "  2. Setup MySQL database"
echo "  3. Install Node.js dependencies"
echo "  4. Build the project"
echo "  5. Run database migrations"
echo "  6. Setup PM2 process manager"
echo "  7. Configure Apache2 (if installed)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Install dependencies
echo -e "${GREEN}[1/7] Installing system dependencies...${NC}"
if [ -f "deployment/vps/install-vps.sh" ]; then
    chmod +x deployment/vps/install-vps.sh
    echo -e "${YELLOW}Running installation script...${NC}"
    ./deployment/vps/install-vps.sh
else
    echo -e "${YELLOW}Installation script not found. Skipping...${NC}"
    echo "Please run: deployment/vps/install-vps.sh manually"
fi

# Step 2: Setup MySQL
echo -e "${GREEN}[2/7] Setting up MySQL database...${NC}"
read -sp "Enter MySQL root password (or press Enter if no password): " MYSQL_ROOT_PASS
echo ""

if [ -z "$MYSQL_ROOT_PASS" ]; then
    MYSQL_CMD="sudo mysql"
else
    MYSQL_CMD="sudo mysql -p$MYSQL_ROOT_PASS"
fi

$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS mindelta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mindelta_user'@'localhost' IDENTIFIED BY 'cele04';
GRANT ALL PRIVILEGES ON mindelta.* TO 'mindelta_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}Database setup complete${NC}"

# Step 3: Install Node.js dependencies
echo -e "${GREEN}[3/7] Installing Node.js dependencies...${NC}"
npm install
npm run install:all

# Step 4: Build project
echo -e "${GREEN}[4/7] Building project...${NC}"
npm run build:shared
npm run build:backend
npm run build:frontend

# Step 5: Run migrations
echo -e "${GREEN}[5/7] Running database migrations...${NC}"
npm run db:migrate

read -p "Run database seeds? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
fi

# Step 6: Setup PM2
echo -e "${GREEN}[6/7] Setting up PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Copy ecosystem config to project root if it doesn't exist
if [ ! -f "ecosystem.config.js" ] && [ -f "deployment/vps/ecosystem.config.js" ]; then
    cp deployment/vps/ecosystem.config.js ecosystem.config.js
    # Update paths in ecosystem config
    sed -i "s|/chitepo|$(pwd)|g" ecosystem.config.js
fi

# Create logs directory
mkdir -p logs

# Start with PM2
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}PM2 setup complete. Run 'pm2 startup' to enable auto-start on boot.${NC}"
else
    echo -e "${YELLOW}ecosystem.config.js not found. Please setup PM2 manually.${NC}"
fi

# Step 7: Configure Apache2
echo -e "${GREEN}[7/7] Configuring Apache2...${NC}"
if command -v apache2 &> /dev/null; then
    if [ -f "deployment/vps/setup-apache2.sh" ]; then
        read -p "Configure Apache2 now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            chmod +x deployment/vps/setup-apache2.sh
            ./deployment/vps/setup-apache2.sh
        fi
    else
        echo -e "${YELLOW}Apache2 configuration script not found.${NC}"
        echo "See deployment/vps/VPS_DEPLOYMENT.md for manual configuration."
    fi
else
    echo -e "${YELLOW}Apache2 not installed. Skipping...${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Quick Start Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure environment variables:"
echo "     - backend/.env"
echo "     - frontend/.env.local"
echo ""
echo "  2. Update Apache2 configuration with your domain:"
echo "     - /etc/apache2/sites-available/chitepo-api.conf"
echo "     - /etc/apache2/sites-available/chitepo-frontend.conf"
echo ""
echo "  3. Install SSL certificate:"
echo "     sudo certbot --apache -d your-domain.com"
echo ""
echo "  4. Check application status:"
echo "     pm2 status"
echo "     pm2 logs"
echo ""
echo "  5. View documentation:"
echo "     deployment/vps/VPS_DEPLOYMENT.md"
echo ""

