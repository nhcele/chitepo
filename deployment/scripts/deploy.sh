#!/bin/bash

# Mindelta Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]

set -e

# Default values
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if kustomize is installed
    if ! command -v kustomize &> /dev/null; then
        log_error "kustomize is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    # Check if we can connect to the cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    cd backend
    docker build -t ghcr.io/mindelta/mindelta-backend:$VERSION .
    
    log_success "Docker image built successfully"
}

# Push Docker image
push_image() {
    log_info "Pushing Docker image..."
    
    docker push ghcr.io/mindelta/mindelta-backend:$VERSION
    
    log_success "Docker image pushed successfully"
}

# Deploy to environment
deploy() {
    log_info "Deploying to $ENVIRONMENT environment..."
    
    cd k8s/$ENVIRONMENT
    
    # Update image in kustomization
    kustomize edit set image ghcr.io/mindelta/mindelta-backend=ghcr.io/mindelta/mindelta-backend:$VERSION
    
    # Apply deployment
    kubectl apply -k .
    
    # Wait for rollout
    log_info "Waiting for deployment rollout..."
    kubectl rollout status deployment/mindelta-backend -n mindelta-$ENVIRONMENT --timeout=600s
    
    log_success "Deployment to $ENVIRONMENT completed successfully"
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Get service URL
    if [ "$ENVIRONMENT" = "production" ]; then
        SERVICE_URL="https://api.mindelta.com"
    else
        SERVICE_URL="https://api-staging.mindelta.com"
    fi
    
    # Wait for service to be ready
    log_info "Checking service health at $SERVICE_URL..."
    
    for i in {1..30}; do
        if curl -f "$SERVICE_URL/health" &> /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        log_warning "Health check failed, retrying in 10 seconds... ($i/30)"
        sleep 10
    done
    
    log_error "Health check failed after 30 attempts"
    exit 1
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    cd k8s/$ENVIRONMENT
    kubectl rollout undo deployment/mindelta-backend -n mindelta-$ENVIRONMENT
    kubectl rollout status deployment/mindelta-backend -n mindelta-$ENVIRONMENT --timeout=300s
    
    log_success "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting Mindelta deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    # Validate inputs
    validate_environment
    
    # Check prerequisites
    check_prerequisites
    
    # Build and push image
    if [ "$VERSION" != "latest" ]; then
        build_image
        push_image
    fi
    
    # Deploy
    deploy
    
    # Health check
    health_check
    
    log_success "Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment] [version]"
        echo "  environment: staging or production (default: staging)"
        echo "  version: Docker image tag (default: latest)"
        echo ""
        echo "Examples:"
        echo "  $0 staging v1.0.0"
        echo "  $0 production latest"
        exit 0
        ;;
    --rollback)
        ENVIRONMENT=${2:-staging}
        if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
        fi
        rollback
        exit 0
        ;;
esac

# Trap to handle errors
trap 'log_error "Deployment failed!"; exit 1' ERR

# Run main function
main "$@"
