#!/bin/bash

# Apache2 Configuration Script for Chitepo Project
# This script configures Apache2 as a reverse proxy for the Chitepo application

set -e

echo "=========================================="
echo "Apache2 Configuration for Chitepo"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Apache2 is installed
if ! command -v apache2 &> /dev/null; then
    echo -e "${RED}Apache2 is not installed. Installing...${NC}"
    sudo apt update
    sudo apt install -y apache2
fi

# Check if Apache2 is running
if ! systemctl is-active --quiet apache2; then
    echo -e "${YELLOW}Starting Apache2...${NC}"
    sudo systemctl start apache2
fi

echo -e "${GREEN}[1/6] Enabling required Apache modules...${NC}"
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
sudo a2enmod headers
sudo a2enmod rewrite
sudo a2enmod ssl

echo -e "${GREEN}[2/6] Fixing ServerName warning...${NC}"
if [ ! -f /etc/apache2/conf-available/servername.conf ]; then
    echo "ServerName localhost" | sudo tee /etc/apache2/conf-available/servername.conf
    sudo a2enconf servername
fi

echo -e "${GREEN}[3/6] Creating virtual host configurations...${NC}"

# Create backend API configuration
sudo tee /etc/apache2/sites-available/chitepo-api.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName api.your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    
    ErrorLog ${APACHE_LOG_DIR}/chitepo-api-error.log
    CustomLog ${APACHE_LOG_DIR}/chitepo-api-access.log combined
</VirtualHost>
EOF

# Create frontend configuration
sudo tee /etc/apache2/sites-available/chitepo-frontend.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:3001/$1 [P,L]
    RewriteCond %{HTTP:Upgrade} !=websocket [NC]
    RewriteRule /(.*) http://localhost:3001/$1 [P,L]
    
    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"
    
    ErrorLog ${APACHE_LOG_DIR}/chitepo-frontend-error.log
    CustomLog ${APACHE_LOG_DIR}/chitepo-frontend-access.log combined
</VirtualHost>
EOF

echo -e "${GREEN}[4/6] Enabling virtual hosts...${NC}"
sudo a2ensite chitepo-api.conf
sudo a2ensite chitepo-frontend.conf

echo -e "${YELLOW}[5/6] Disabling default site (optional)...${NC}"
read -p "Disable default Apache site? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo a2dissite 000-default.conf
    echo -e "${GREEN}Default site disabled${NC}"
fi

echo -e "${GREEN}[6/6] Testing Apache configuration...${NC}"
if sudo apache2ctl configtest; then
    echo -e "${GREEN}Configuration test passed!${NC}"
    echo -e "${GREEN}Restarting Apache2...${NC}"
    sudo systemctl restart apache2
    echo -e "${GREEN}Apache2 restarted successfully${NC}"
else
    echo -e "${RED}Configuration test failed! Please check the errors above.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Apache2 Configuration Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit /etc/apache2/sites-available/chitepo-api.conf"
echo "     Replace 'api.your-domain.com' with your actual domain"
echo ""
echo "  2. Edit /etc/apache2/sites-available/chitepo-frontend.conf"
echo "     Replace 'your-domain.com' with your actual domain"
echo ""
echo "  3. Test configuration: sudo apache2ctl configtest"
echo ""
echo "  4. Restart Apache: sudo systemctl restart apache2"
echo ""
echo "  5. Install SSL certificate:"
echo "     sudo apt install -y certbot python3-certbot-apache"
echo "     sudo certbot --apache -d your-domain.com -d www.your-domain.com -d api.your-domain.com"
echo ""
echo "View logs:"
echo "  sudo tail -f /var/log/apache2/chitepo-api-error.log"
echo "  sudo tail -f /var/log/apache2/chitepo-frontend-error.log"
echo ""

