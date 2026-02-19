#!/bin/bash

# Simple Deployment Script for Chitepo Platform
# This script automates the initial VPS setup

set -e  # Exit on error

echo "=========================================="
echo "Chitepo Platform - Simple Deployment"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
PROJECT_DIR="/opt/chitepo"

echo "Step 1: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "Step 2: Installing required packages..."
apt install -y curl git ufw nginx certbot python3-certbot-nginx

echo ""
echo "Step 3: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

echo ""
echo "Step 4: Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

echo ""
echo "Step 5: Adding user to docker group..."
usermod -aG docker $ACTUAL_USER

echo ""
echo "Step 6: Configuring firewall..."
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw status

echo ""
echo "Step 7: Creating project directory..."
mkdir -p $PROJECT_DIR
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR

echo ""
echo "Step 8: Creating backup directory..."
mkdir -p $PROJECT_DIR/backups
chown -R $ACTUAL_USER:$ACTUAL_USER $PROJECT_DIR/backups

echo ""
echo "Step 9: Configuring Docker daemon..."
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone your project to $PROJECT_DIR"
echo "2. Create .env.production file with your settings"
echo "3. Run: docker compose -f docker-compose.prod.yml up -d"
echo "4. Configure Nginx (see SIMPLE_DEPLOYMENT_GUIDE.md)"
echo "5. Setup SSL: certbot --nginx -d yourdomain.com"
echo ""
echo "Note: You may need to log out and back in for docker group changes to take effect"
echo ""
