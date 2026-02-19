#!/bin/bash

# Chitepo Project VPS Installation Script
# This script installs all dependencies required for the Chitepo project on a Linux VPS

set -e  # Exit on error

echo "=========================================="
echo "Chitepo Project VPS Installation Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Note: Some commands require sudo. You may be prompted for your password.${NC}"
fi

# Step 1: Update System
echo -e "${GREEN}[1/12] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js 18.x
echo -e "${GREEN}[2/12] Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo -e "${YELLOW}Node.js is already installed: $(node --version)${NC}"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"
echo -e "${GREEN}npm version: $NPM_VERSION${NC}"

# Step 3: Install MySQL
echo -e "${GREEN}[3/12] Installing MySQL 8.0...${NC}"
if ! command -v mysql &> /dev/null; then
    sudo apt install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
else
    echo -e "${YELLOW}MySQL is already installed${NC}"
fi

# Step 4: Install Redis
echo -e "${GREEN}[4/12] Installing Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
else
    echo -e "${YELLOW}Redis is already installed${NC}"
fi

# Step 5: Install Git
echo -e "${GREEN}[5/12] Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
else
    echo -e "${YELLOW}Git is already installed: $(git --version)${NC}"
fi

# Step 6: Install Build Tools
echo -e "${GREEN}[6/12] Installing build tools...${NC}"
sudo apt install -y build-essential python3

# Step 7: Install Docker (Optional)
echo -e "${GREEN}[7/12] Installing Docker and Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo apt install -y docker-compose-plugin
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Docker installed. You may need to log out and log back in for group changes to take effect.${NC}"
else
    echo -e "${YELLOW}Docker is already installed${NC}"
fi

# Step 8: Create Project Directory
echo -e "${GREEN}[8/12] Creating /chitepo directory...${NC}"
sudo mkdir -p /chitepo
sudo chown -R $USER:$USER /chitepo
echo -e "${GREEN}Directory /chitepo created and ownership set${NC}"

# Step 9: Setup MySQL Database
echo -e "${GREEN}[9/12] Setting up MySQL database...${NC}"
echo -e "${YELLOW}You will be prompted to enter MySQL root password${NC}"
read -sp "Enter MySQL root password (or press Enter if no password): " MYSQL_ROOT_PASS
echo ""

if [ -z "$MYSQL_ROOT_PASS" ]; then
    MYSQL_CMD="sudo mysql"
else
    MYSQL_CMD="sudo mysql -p$MYSQL_ROOT_PASS"
fi

# Create database and user
$MYSQL_CMD <<EOF
CREATE DATABASE IF NOT EXISTS mindelta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'mindelta_user'@'localhost' IDENTIFIED BY 'cele04';
GRANT ALL PRIVILEGES ON mindelta.* TO 'mindelta_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}Database 'mindelta' and user 'mindelta_user' created${NC}"

# Step 10: Install PM2
echo -e "${GREEN}[10/12] Installing PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo -e "${YELLOW}PM2 is already installed${NC}"
fi

# Step 11: Check Web Server (Apache2 or Nginx)
echo -e "${GREEN}[11/12] Checking web server...${NC}"
if command -v apache2 &> /dev/null; then
    echo -e "${GREEN}Apache2 is already installed and running${NC}"
    echo -e "${YELLOW}Note: Apache2 configuration instructions are in VPS_DEPLOYMENT.md${NC}"
    echo -e "${YELLOW}You can use Apache2 or install Nginx as an alternative${NC}"
elif command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx is already installed${NC}"
else
    echo -e "${YELLOW}No web server detected. Installing Nginx...${NC}"
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo -e "${GREEN}Nginx installed and started${NC}"
fi

# Step 12: Install UFW Firewall
echo -e "${GREEN}[12/12] Installing and configuring firewall...${NC}"
if ! command -v ufw &> /dev/null; then
    sudo apt install -y ufw
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo -e "${YELLOW}Firewall rules added. Run 'sudo ufw enable' to activate.${NC}"
else
    echo -e "${YELLOW}UFW is already installed${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Installation Complete!"
echo "==========================================${NC}"
echo ""
echo "Installed components:"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ npm $(npm --version)"
echo "  ✓ MySQL 8.0"
echo "  ✓ Redis"
echo "  ✓ Git"
echo "  ✓ Build Tools"
echo "  ✓ Docker & Docker Compose"
echo "  ✓ PM2"
if command -v apache2 &> /dev/null; then
    echo "  ✓ Apache2 (already installed)"
elif command -v nginx &> /dev/null; then
    echo "  ✓ Nginx"
fi
echo "  ✓ UFW Firewall"
echo ""
echo "Next steps:"
echo "  1. Transfer your project files to /chitepo"
echo "  2. Run: cd /chitepo && npm install && npm run install:all"
echo "  3. Configure .env files in backend/ and frontend/"
echo "  4. Run: npm run build"
echo "  5. Run: npm run db:migrate"
echo "  6. Setup PM2 and Nginx (see VPS_DEPLOYMENT.md)"
echo ""
echo -e "${YELLOW}Note: If Docker was installed, you may need to log out and log back in${NC}"
echo -e "${YELLOW}      for the docker group changes to take effect.${NC}"
echo ""

