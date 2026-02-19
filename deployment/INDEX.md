# Deployment Files Index

Quick reference for all deployment-related files in this folder.

## 📁 Main Files

- **README.md** - Overview of all deployment methods
- **DEPLOYMENT.md** - Kubernetes/Docker CI/CD deployment guide

## 📁 VPS Deployment (`vps/`)

### Documentation
- **VPS_DEPLOYMENT.md** - Complete step-by-step VPS deployment guide
- **QUICK_INSTALL_VPS.md** - Quick reference with copy-paste commands

### Scripts
- **install-vps.sh** - Automated installation of all system dependencies
- **setup-apache2.sh** - Automated Apache2 reverse proxy configuration
- **quick-start.sh** - Complete project setup script (dependencies + project)

### Configuration Files
- **apache2-chitepo.conf** - Apache2 virtual host configuration template
- **ecosystem.config.js** - PM2 process manager configuration

## 📁 Docker Deployment (`docker/`)

- **docker-compose.yml** - Docker Compose configuration for development

## 📁 Scripts (`scripts/`)

- **deploy.sh** - Kubernetes deployment script (staging/production)
- **deploy-infrastructure.sh** - Terraform infrastructure deployment script

## 📁 Related Folders (in project root)

- **k8s/** - Kubernetes manifests and configurations
- **terraform/** - Terraform infrastructure as code
- **backend/Dockerfile** - Backend Docker image definition

## 🚀 Quick Start by Deployment Type

### VPS Deployment
```bash
# Option 1: Automated quick start
chmod +x deployment/vps/quick-start.sh
./deployment/vps/quick-start.sh

# Option 2: Step by step
chmod +x deployment/vps/install-vps.sh
./deployment/vps/install-vps.sh
# Then follow VPS_DEPLOYMENT.md
```

### Docker Deployment
```bash
docker-compose -f deployment/docker/docker-compose.yml up -d
```

### Kubernetes Deployment
```bash
./deployment/scripts/deploy.sh staging v1.0.0
```

### Terraform Infrastructure
```bash
./deployment/scripts/deploy-infrastructure.sh staging apply
```

## 📚 Documentation Priority

1. **New to deployment?** → Start with `README.md`
2. **VPS deployment?** → Read `vps/VPS_DEPLOYMENT.md`
3. **Kubernetes deployment?** → Read `DEPLOYMENT.md`
4. **Quick reference?** → Check `vps/QUICK_INSTALL_VPS.md`

## 🔗 External Resources

- Project README: `../README.md`
- Backend Documentation: `../backend/README.md`
- Frontend Documentation: `../frontend/README.md`

