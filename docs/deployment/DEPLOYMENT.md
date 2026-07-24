# Mindelta Deployment Guide

## 🚀 **CI/CD Pipeline Overview**

The Mindelta platform features a comprehensive CI/CD pipeline built with GitHub Actions, Docker, and Kubernetes. This ensures automated testing, security scanning, and seamless deployments to staging and production environments.

## 📋 **Pipeline Components**

### **1. GitHub Actions Workflows**

#### **Main CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push to main/develop, Pull Requests
- **Stages**:
  - Code Quality & Security (ESLint, Prettier, TypeScript, Snyk)
  - Unit & Integration Tests (Jest with MySQL)
  - E2E Tests (Playwright)
  - Docker Build & Push
  - Deploy to Staging (develop branch)
  - Deploy to Production (main branch)
  - Performance Tests (Lighthouse CI)
  - Container Security Scan (Trivy)

#### **Pull Request Checks** (`.github/workflows/pull-request.yml`)
- **Triggers**: Pull Request creation/update
- **Checks**:
  - Type checking and linting
  - Unit tests
  - PR size analysis
  - Dependency security audit
  - API breaking changes detection
  - Test coverage validation (≥80%)

#### **Docker Build Pipeline** (`.github/workflows/docker.yml`)
- **Triggers**: Push, PRs, tags, manual
- **Features**:
  - Multi-platform builds (amd64/arm64)
  - Container image testing
  - Security scanning (Trivy, Snyk)
  - Automatic tagging strategy

#### **Release Pipeline** (`.github/workflows/release.yml`)
- **Triggers**: Git tags (v*.*.*)
- **Process**:
  - Automated changelog generation
  - GitHub Release creation
  - Production deployment
  - Smoke tests and notifications

#### **Security Pipeline** (`.github/workflows/security.yml`)
- **Triggers**: Daily schedule, manual, main branch
- **Scans**:
  - Code security (Trivy, CodeQL, Snyk)
  - Dependency vulnerabilities
  - Container security
  - Secrets scanning (Gitleaks, TruffleHog)
  - License compliance

### **2. Docker Configuration**

#### **Dockerfile** (`backend/Dockerfile`)
- **Multi-stage build** for optimized production images
- **Security best practices**:
  - Non-root user (mindelta:1001)
  - Minimal Alpine Linux base
  - Health checks
  - Proper signal handling with dumb-init

#### **Docker Compose** (`docker-compose.yml`)
- **Development environment** with all services:
  - MySQL 8.0 with health checks
  - Redis 7 for caching
  - MinIO for S3-compatible storage
  - MailHog for email testing
  - Backend service with hot reload

### **3. Kubernetes Deployment**

#### **Namespace** (`k8s/namespace.yaml`)
- Isolated environments: `mindelta` and `mindelta-staging`

#### **Configuration** (`k8s/configmap.yaml`, `k8s/secrets.yaml`)
- Environment-specific configurations
- Secure secret management

#### **Deployment** (`k8s/backend-deployment.yaml`)
- **Production-ready** with:
  - 3 replicas (auto-scaling to 20)
  - Resource limits and requests
  - Health and readiness probes
  - Security context (non-root, read-only filesystem)
  - Horizontal Pod Autoscaler

#### **Ingress** (`k8s/ingress.yaml`)
- **TLS termination** with Let's Encrypt
- **Rate limiting** (100 req/min)
- **Multiple domains** (mindelta.com, api.mindelta.com)

#### **Environment-specific** (`k8s/staging/`, `k8s/production/`)
- **Kustomize** for environment management
- **Different resource allocations**
- **Environment-specific configurations**

## 🛠 **Deployment Commands**

### **Local Development**

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop environment
docker-compose down
```

### **Manual Deployment**

```bash
# Deploy to staging
./scripts/deploy.sh staging v1.0.0

# Deploy to production
./scripts/deploy.sh production v1.0.0

# Rollback deployment
./scripts/deploy.sh --rollback staging
```

### **Kubernetes Commands**

```bash
# Apply staging deployment
kubectl apply -k k8s/staging

# Apply production deployment
kubectl apply -k k8s/production

# Check deployment status
kubectl rollout status deployment/mindelta-backend -n mindelta

# View pods
kubectl get pods -n mindelta

# View logs
kubectl logs -f deployment/mindelta-backend -n mindelta
```

## 🔧 **Environment Configuration**

### **Required Secrets**

Create these secrets in your GitHub repository:

```bash
# GitHub Repository Secrets
GITHUB_TOKEN              # Auto-provided by GitHub
SNYK_TOKEN                # Snyk API key
SLACK_WEBHOOK_URL         # Slack notifications
KUBE_CONFIG               # Kubernetes config (base64)
LHCI_GITHUB_APP_TOKEN     # Lighthouse CI token
GITLEAKS_LICENSE          # Gitleaks license (optional)
```

### **Kubernetes Secrets**

```bash
# Create secrets for production
kubectl create secret generic mindelta-secrets \
  --from-literal=DB_USERNAME=... \
  --from-literal=DB_PASSWORD=... \
  --from-literal=OPENAI_API_KEY=... \
  --from-literal=PINECONE_API_KEY=... \
  --from-literal=AWS_ACCESS_KEY_ID=... \
  --from-literal=AWS_SECRET_ACCESS_KEY=... \
  -n mindelta
```

## 📊 **Monitoring & Observability**

### **Health Checks**

- **Application Health**: `/health` endpoint
- **Database Health**: MySQL health checks
- **Redis Health**: Redis ping checks
- **Container Health**: Docker health checks

### **Logging**

- **Application Logs**: Structured JSON logging
- **Kubernetes Logs**: `kubectl logs` integration
- **Docker Logs**: Container log aggregation

### **Metrics**

- **Resource Usage**: CPU, memory, disk
- **Application Metrics**: Request rates, error rates
- **Business Metrics**: User engagement, course completion

## 🔒 **Security Features**

### **Container Security**
- **Non-root user execution**
- **Read-only filesystem**
- **Minimal attack surface**
- **Regular security scanning**

### **Network Security**
- **TLS encryption** everywhere
- **Rate limiting** on API endpoints
- **Network policies** in Kubernetes
- **WAF rules** in production

### **Code Security**
- **Dependency scanning** (Snyk, npm audit)
- **Secrets detection** (Gitleaks, TruffleHog)
- **Static analysis** (CodeQL, ESLint)
- **License compliance** checking

## 🚨 **Deployment Process**

### **Staging Deployment** (Automatic on `develop` branch)

1. **Code Quality Checks**
   - ESLint, Prettier, TypeScript compilation
   - Security audit and Snyk scan

2. **Testing Pipeline**
   - Unit tests with coverage
   - Integration tests with test database
   - E2E tests with Playwright

3. **Build & Deploy**
   - Docker image build and push
   - Kubernetes deployment
   - Health checks and smoke tests

4. **Performance Testing**
   - Lighthouse CI analysis
   - Performance regression detection

### **Production Deployment** (Automatic on `main` branch)

1. **All staging checks** plus:
2. **Additional security scanning**
3. **Manual approval** (if configured)
4. **Blue-green deployment** strategy
5. **Extended smoke testing**
6. **Slack notifications**

### **Release Process** (Manual with Git tags)

1. **Tag release**: `git tag v1.0.0 && git push origin v1.0.0`
2. **Automated changelog** generation
3. **GitHub Release** creation
4. **Production deployment**
5. **Post-deployment verification**

## 🔄 **Rollback Procedures**

### **Automatic Rollback**
- Health check failures trigger automatic rollback
- Kubernetes deployment rollback on probe failures

### **Manual Rollback**
```bash
# Using deployment script
./scripts/deploy.sh --rollback production

# Using kubectl
kubectl rollout undo deployment/mindelta-backend -n mindelta
```

## 📈 **Performance Optimization**

### **Build Optimization**
- **Multi-stage builds** reduce image size
- **Layer caching** speeds up builds
- **Parallel builds** for multiple platforms

### **Deployment Optimization**
- **Rolling updates** with zero downtime
- **Horizontal Pod Autoscaling** based on load
- **Resource limits** prevent resource contention

### **Caching Strategy**
- **Docker layer caching** in CI/CD
- **npm dependency caching**
- **Build artifact caching**

## 🎯 **Best Practices**

### **Development**
- **Feature branches** for all changes
- **Pull request reviews** required
- **Automated testing** before merge
- **Security scanning** on every commit

### **Deployment**
- **Environment parity** between staging and production
- **Immutable infrastructure** with containers
- **Infrastructure as code** with Kubernetes
- **Automated rollbacks** on failure

### **Monitoring**
- **Proactive alerting** on issues
- **Performance monitoring** and optimization
- **Security monitoring** and incident response
- **Regular security updates** and patches

## 🆘 **Troubleshooting**

### **Common Issues**

**Build Failures**
```bash
# Check build logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache
```

**Deployment Failures**
```bash
# Check deployment status
kubectl get deployments -n mindelta

# Check pod logs
kubectl logs -f deployment/mindelta-backend -n mindelta

# Describe pod for errors
kubectl describe pod -n mindelta
```

**Health Check Failures**
```bash
# Check health endpoint
curl https://api.mindelta.com/health

# Check pod readiness
kubectl get pods -n mindelta -w
```

### **Emergency Procedures**

1. **Immediate rollback**: Use rollback script or kubectl
2. **Scale down**: `kubectl scale deployment --replicas=0`
3. **Emergency patch**: Hotfix branch and expedited deployment
4. **Incident response**: Follow security incident procedures

## 📞 **Support**

For deployment issues:
1. **Check logs** and error messages
2. **Review GitHub Actions** workflow runs
3. **Consult monitoring dashboards**
4. **Contact DevOps team** with full context

---

This deployment guide ensures reliable, secure, and efficient deployment of the Mindelta platform across all environments. 🚀
