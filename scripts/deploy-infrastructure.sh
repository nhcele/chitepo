#!/bin/bash

# Mindelta Infrastructure Deployment Script
# Usage: ./scripts/deploy-infrastructure.sh [environment] [action]

set -e

# Default values
ENVIRONMENT=${1:-production}
ACTION=${2:-apply}
REGION=${3:-us-east-1}

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
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be 'dev', 'staging', or 'production'"
        exit 1
    fi
}

# Validate action
validate_action() {
    if [[ ! "$ACTION" =~ ^(plan|apply|destroy|validate|fmt)$ ]]; then
        log_error "Invalid action: $ACTION. Must be 'plan', 'apply', 'destroy', 'validate', or 'fmt'"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if terraform is installed
    if ! command -v terraform &> /dev/null; then
        log_error "terraform is not installed"
        exit 1
    fi
    
    # Check if aws cli is installed
    if ! command -v aws &> /dev/null; then
        log_error "aws cli is not installed"
        exit 1
    fi
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured"
        exit 1
    fi
    
    # Check Terraform version
    TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
    REQUIRED_VERSION="1.0"
    
    if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$TERRAFORM_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
        log_error "Terraform version $TERRAFORM_VERSION is too old. Required: >= $REQUIRED_VERSION"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup Terraform backend
setup_backend() {
    log_info "Setting up Terraform backend..."
    
    # Create S3 bucket for state if it doesn't exist
    BUCKET_NAME="mindelta-terraform-state"
    
    if ! aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
        log_info "Creating S3 bucket for Terraform state..."
        aws s3api create-bucket \
            --bucket "$BUCKET_NAME" \
            --region "$REGION" \
            --create-bucket-configuration LocationConstraint="$REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "$BUCKET_NAME" \
            --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
        
        # Create DynamoDB table for state locking
        aws dynamodb create-table \
            --table-name "mindelta-terraform-locks" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION"
        
        log_success "Terraform backend created"
    else
        log_info "Terraform backend already exists"
    fi
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    
    cd terraform
    
    # Create environment-specific tfvars file if it doesn't exist
    if [[ ! -f "terraform.tfvars" ]]; then
        if [[ -f "terraform.tfvars.example" ]]; then
            cp terraform.tfvars.example terraform.tfvars
            log_warning "Created terraform.tfvars from example. Please review and customize."
        fi
    fi
    
    # Initialize Terraform
    terraform init \
        -backend-config="bucket=mindelta-terraform-state" \
        -backend-config="key=terraform-${ENVIRONMENT}.tfstate" \
        -backend-config="region=$REGION" \
        -backend-config="encrypt=true" \
        -backend-config="dynamodb_table=mindelta-terraform-locks"
    
    log_success "Terraform initialized"
}

# Validate Terraform configuration
validate_terraform() {
    log_info "Validating Terraform configuration..."
    
    cd terraform
    terraform validate
    
    log_success "Terraform configuration is valid"
}

# Format Terraform files
format_terraform() {
    log_info "Formatting Terraform files..."
    
    cd terraform
    terraform fmt -recursive
    
    log_success "Terraform files formatted"
}

# Plan Terraform deployment
plan_terraform() {
    log_info "Planning Terraform deployment..."
    
    cd terraform
    terraform plan \
        -var-file="terraform.tfvars" \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$REGION" \
        -out="terraform.plan"
    
    log_success "Terraform plan created"
}

# Apply Terraform deployment
apply_terraform() {
    log_info "Applying Terraform deployment..."
    
    cd terraform
    
    # Check if plan file exists
    if [[ ! -f "terraform.plan" ]]; then
        log_warning "No plan file found. Creating plan..."
        plan_terraform
    fi
    
    terraform apply terraform.plan
    
    log_success "Terraform deployment completed"
}

# Destroy Terraform deployment
destroy_terraform() {
    log_warning "This will destroy all infrastructure. Are you sure?"
    read -p "Type 'destroy' to continue: " confirmation
    
    if [[ "$confirmation" != "destroy" ]]; then
        log_info "Destruction cancelled"
        exit 0
    fi
    
    log_info "Destroying Terraform deployment..."
    
    cd terraform
    terraform destroy \
        -var-file="terraform.tfvars" \
        -var="environment=$ENVIRONMENT" \
        -var="aws_region=$REGION" \
        -auto-approve
    
    log_success "Terraform deployment destroyed"
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl..."
    
    cd terraform
    
    # Get cluster name from Terraform output
    CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")
    
    if [[ -n "$CLUSTER_NAME" ]]; then
        aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"
        log_success "kubectl configured for cluster: $CLUSTER_NAME"
    else
        log_warning "Cluster not found. Skipping kubectl configuration."
    fi
}

# Show outputs
show_outputs() {
    log_info "Infrastructure outputs:"
    
    cd terraform
    terraform output
    
    echo ""
    log_info "Useful commands:"
    echo "  Configure kubectl: aws eks update-kubeconfig --name \$(terraform output -raw cluster_name) --region $REGION"
    echo "  Check nodes: kubectl get nodes"
    echo "  Check pods: kubectl get pods -A"
    echo "  Access Grafana: kubectl port-forward -n monitoring svc/grafana 3000:80"
}

# Health checks
health_check() {
    log_info "Running health checks..."
    
    cd terraform
    
    # Check EKS cluster
    CLUSTER_NAME=$(terraform output -raw cluster_name 2>/dev/null || echo "")
    if [[ -n "$CLUSTER_NAME" ]]; then
        if aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" &> /dev/null; then
            log_success "EKS cluster is healthy"
        else
            log_error "EKS cluster health check failed"
        fi
    fi
    
    # Check RDS instance
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint 2>/dev/null || echo "")
    if [[ -n "$RDS_ENDPOINT" ]]; then
        log_info "RDS endpoint: $RDS_ENDPOINT"
        # You could add more sophisticated health checks here
    fi
    
    # Check Redis endpoint
    REDIS_ENDPOINT=$(terraform output -raw redis_endpoint 2>/dev/null || echo "")
    if [[ -n "$REDIS_ENDPOINT" ]]; then
        log_info "Redis endpoint: $REDIS_ENDPOINT"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Remove any temporary files
    rm -f terraform/terraform.plan
}

# Main deployment flow
main() {
    log_info "Starting Mindelta infrastructure deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Action: $ACTION"
    log_info "Region: $REGION"
    
    # Validate inputs
    validate_environment
    validate_action
    
    # Check prerequisites
    check_prerequisites
    
    # Setup backend
    setup_backend
    
    # Initialize Terraform
    init_terraform
    
    # Execute action
    case "$ACTION" in
        "validate")
            validate_terraform
            ;;
        "fmt")
            format_terraform
            ;;
        "plan")
            validate_terraform
            plan_terraform
            ;;
        "apply")
            validate_terraform
            plan_terraform
            apply_terraform
            configure_kubectl
            show_outputs
            health_check
            ;;
        "destroy")
            destroy_terraform
            ;;
    esac
    
    log_success "Infrastructure deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [environment] [action] [region]"
        echo "  environment: dev, staging, or production (default: production)"
        echo "  action: plan, apply, destroy, validate, or fmt (default: apply)"
        echo "  region: AWS region (default: us-east-1)"
        echo ""
        echo "Examples:"
        echo "  $0 staging plan"
        echo "  $0 production apply"
        echo "  $0 dev destroy"
        exit 0
        ;;
esac

# Trap to handle errors and cleanup
trap 'log_error "Infrastructure deployment failed!"; cleanup; exit 1' ERR

# Run main function
main "$@"
