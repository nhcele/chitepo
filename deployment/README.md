# Chitepo Project Deployment Guide

This folder contains all deployment-related documentation, scripts, and configuration files for **native VPS deployment** of the Chitepo project.

## 📁 Folder Structure

```
deployment/
├── README.md                    # This file - Main deployment guide
├── vps/                         # VPS deployment files
│   ├── VPS_DEPLOYMENT.md        # Complete VPS deployment guide
│   ├── QUICK_INSTALL_VPS.md     # Quick reference for VPS installation
│   ├── install-vps.sh          # Automated VPS installation script
│   ├── setup-apache2.sh         # Apache2 configuration script
│   ├── quick-start.sh          # Complete project setup script
│   ├── apache2-chitepo.conf     # Apache2 virtual host configuration
│   └── ecosystem.config.js     # PM2 process manager configuration
└── scripts/                     # Deployment scripts
    └── deploy-vps.sh            # VPS deployment automation script
```

## 🚀 Native VPS Deployment (Recommended)

**Best for:**
- Small to large-scale deployments
- Cost-effective hosting
- Full control over the server
- Production-ready setup
- No container overhead

**Location:** `deployment/vps/`

**Quick Start:**
```bash
# Option 1: Complete automated setup (recommended)
cd /chitepo
chmod +x deployment/vps/quick-start.sh
./deployment/vps/quick-start.sh

# Option 2: Step-by-step installation
chmod +x deployment/vps/install-vps.sh
./deployment/vps/install-vps.sh
# Then follow the guide in VPS_DEPLOYMENT.md
```

**Documentation:**
- **Complete Guide:** [`vps/VPS_DEPLOYMENT.md`](vps/VPS_DEPLOYMENT.md)
- **Quick Reference:** [`vps/QUICK_INSTALL_VPS.md`](vps/QUICK_INSTALL_VPS.md)

**Features:**
- ✅ Native service installation (no containers)
- ✅ Automated dependency installation
- ✅ Apache2/Nginx reverse proxy setup
- ✅ PM2 process management (production-ready)
- ✅ Native MySQL and Redis services
- ✅ SSL certificate automation (Let's Encrypt)
- ✅ Production-ready configuration
- ✅ Systemd service integration
- ✅ Automated backups
- ✅ Health monitoring

## 📋 Prerequisites

### System Requirements
- **Linux VPS** (Ubuntu 20.04+ or Debian 11+ recommended)
- **Root or sudo access** to install packages
- **SSH access** to the server
- **Minimum 2GB RAM** (4GB+ recommended for production)
- **20GB+ disk space** (50GB+ recommended)
- **Domain name** (optional but recommended for SSL)

### Software Requirements
- Node.js 18.x or higher
- npm 9.x or higher
- MySQL 8.0
- Redis 6+
- Apache2 or Nginx
- PM2 (for process management)

## 🔧 Environment Configuration

### Required Environment Variables

All deployment methods require these environment variables:

**Backend (.env):**
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=mindelta_user
DB_PASSWORD=your-password
DB_DATABASE=mindelta
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://your-domain.com
```

## 🏗️ Architecture Overview

### Native Services Stack

```
┌─────────────────────────────────────────┐
│         Apache2 / Nginx                 │
│      (Reverse Proxy + SSL)              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌──────▼───┐
│Frontend│         │ Backend  │
│Next.js │         │ NestJS   │
│:3001   │         │ :3000    │
└────────┘         └────┬─────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ┌───▼───┐      ┌───▼───┐      ┌───▼───┐
    │ MySQL │      │ Redis │      │ PM2   │
    │ :3306 │      │ :6379 │      │Manager│
    └───────┘      └───────┘      └───────┘
```

### Service Management
- **PM2** - Process manager for Node.js applications
- **Systemd** - System service management
- **Apache2/Nginx** - Web server and reverse proxy
- **MySQL** - Native database service
- **Redis** - Native caching service

## 🚦 Why Native VPS Deployment?

**Advantages:**
- ✅ **No container overhead** - Direct access to system resources
- ✅ **Simpler architecture** - Easier to understand and maintain
- ✅ **Cost-effective** - No container orchestration costs
- ✅ **Full control** - Complete access to system configuration
- ✅ **Better performance** - No virtualization layer
- ✅ **Easier debugging** - Direct access to logs and processes
- ✅ **Production-ready** - PM2 provides process management and auto-restart

## 📚 Additional Resources

- **VPS Deployment:** See [`vps/VPS_DEPLOYMENT.md`](vps/VPS_DEPLOYMENT.md)
- **Kubernetes Guide:** See [`DEPLOYMENT.md`](DEPLOYMENT.md)
- **Docker Compose:** See [`docker/docker-compose.yml`](docker/docker-compose.yml)
- **Project README:** See [`../README.md`](../README.md)

## 🆘 Troubleshooting

### Common Issues

**VPS Deployment:**
- Port conflicts: Check if ports 3000, 3001, 3306, 6379 are available
- Permission issues: Ensure user has sudo access
- Service not starting: Check logs with `pm2 logs` or `journalctl -u service-name`

**Docker Deployment:**
- Container won't start: Check `docker-compose logs`
- Port conflicts: Modify ports in `docker-compose.yml`
- Volume permissions: Check file ownership

**Kubernetes Deployment:**
- Pods not starting: Check `kubectl describe pod`
- Image pull errors: Verify registry credentials
- Resource limits: Check node capacity

**Terraform:**
- State lock errors: Check DynamoDB table
- AWS credential errors: Verify AWS CLI configuration
- Resource conflicts: Check existing resources in AWS

## 🔐 Security Considerations

1. **Always use HTTPS in production**
2. **Keep secrets in environment variables or secret managers**
3. **Regularly update dependencies**
4. **Use strong passwords and JWT secrets**
5. **Enable firewall rules**
6. **Regular security audits**
7. **Monitor logs for suspicious activity**

## 📞 Support

For deployment issues:
1. Check the relevant deployment guide
2. Review logs and error messages
3. Check service status
4. Consult troubleshooting sections
5. Contact the development team

---

**Last Updated:** December 2025

