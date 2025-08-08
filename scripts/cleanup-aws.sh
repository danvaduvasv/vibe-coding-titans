#!/bin/bash

# Histowalk - AWS Cleanup Script
# This script removes all AWS resources created by the deploy-aws-version.sh script

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration - can be overridden by environment variables
AWS_REGION="${AWS_REGION:-eu-west-1}"
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-histowalk}"
APP_NAME="histowalk"

# Valid environments
VALID_ENVIRONMENTS=("develop" "qa" "prod")

# Functions
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

log_note() {
    echo -e "${PURPLE}[NOTE]${NC} $1"
}

# Print usage
usage() {
    echo "Usage: $0 [ENVIRONMENT] [--force]"
    echo
    echo "Parameters:"
    echo "  ENVIRONMENT    Target environment to cleanup (develop, qa, prod)"
    echo "  --force        Skip confirmation prompts (dangerous!)"
    echo
    echo "Environment variables:"
    echo "  AWS_REGION              AWS region (default: eu-west-1)"
    echo "  ECR_REPOSITORY_NAME     ECR repository name (default: histowalk)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive mode (recommended)"
    echo "  $0 develop              # Cleanup develop environment"
    echo "  $0 prod --force         # Force cleanup production (dangerous!)"
    echo
    echo "⚠️  WARNING: This script will permanently delete:"
    echo "  - App Runner services"
    echo "  - IAM roles and policies"
    echo "  - Secrets Manager secrets"
    echo "  - ECR repository and images"
    echo "  - All associated data"
    echo
}

# Interactive environment selection
select_environment() {
    if [ -n "${1:-}" ]; then
        ENVIRONMENT="$1"
        # Validate provided environment
        if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: ${VALID_ENVIRONMENTS[*]}"
            exit 1
        fi
        log_info "Using provided environment: $ENVIRONMENT"
    else
        echo
        log_info "Select environment to cleanup:"
        echo "1) develop  - Development environment"
        echo "2) qa       - Quality Assurance environment" 
        echo "3) prod     - Production environment"
        echo "4) all      - All environments"
        echo
        
        while true; do
            read -p "Enter choice (1-4): " choice
            case $choice in
                1) ENVIRONMENT="develop"; break ;;
                2) ENVIRONMENT="qa"; break ;;
                3) ENVIRONMENT="prod"; break ;;
                4) ENVIRONMENT="all"; break ;;
                *) log_error "Invalid choice. Please enter 1, 2, 3, or 4." ;;
            esac
        done
        
        log_info "Selected environment: $ENVIRONMENT"
    fi
}

# Check required tools and permissions
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v aws >/dev/null 2>&1; then
        missing_tools+=("aws-cli")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid."
        log_error "Please run 'aws configure' or set AWS environment variables."
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# Get AWS account ID
get_aws_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
}

# Check if App Runner service exists
check_app_runner_service_exists() {
    local service_name="$1"
    local service_arn="arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${service_name}"
    
    if aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete App Runner service
delete_app_runner_service() {
    local service_name="$1"
    local service_arn="arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${service_name}"
    
    log_info "Deleting App Runner service: $service_name"
    
    # Delete the service
    aws apprunner delete-service \
        --service-arn "$service_arn" \
        --region "$AWS_REGION"
    
    log_success "App Runner service deletion initiated: $service_name"
    
    # Wait for service to be deleted
    log_info "Waiting for service to be deleted..."
    while aws apprunner describe-service --service-arn "$service_arn" --region "$AWS_REGION" >/dev/null 2>&1; do
        echo -n "."
        sleep 10
    done
    
    log_success "App Runner service deleted: $service_name"
}

# Check if IAM role exists
check_iam_role_exists() {
    local role_name="$1"
    
    if aws iam get-role --role-name "$role_name" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete IAM role
delete_iam_role() {
    local role_name="$1"
    
    log_info "Deleting IAM role: $role_name"
    
    # Detach managed policies
    local attached_policies
    attached_policies=$(aws iam list-attached-role-policies --role-name "$role_name" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null || echo "")
    
    for policy_arn in $attached_policies; do
        if [ -n "$policy_arn" ]; then
            log_info "Detaching policy: $policy_arn"
            aws iam detach-role-policy --role-name "$role_name" --policy-arn "$policy_arn"
        fi
    done
    
    # Delete inline policies
    local inline_policies
    inline_policies=$(aws iam list-role-policies --role-name "$role_name" --query 'PolicyNames' --output text 2>/dev/null || echo "")
    
    for policy_name in $inline_policies; do
        if [ -n "$policy_name" ]; then
            log_info "Deleting inline policy: $policy_name"
            aws iam delete-role-policy --role-name "$role_name" --policy-name "$policy_name"
        fi
    done
    
    # Delete the role
    aws iam delete-role --role-name "$role_name"
    
    log_success "IAM role deleted: $role_name"
}

# Check if Secrets Manager secret exists
check_secret_exists() {
    local secret_name="$1"
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Secrets Manager secret
delete_secret() {
    local secret_name="$1"
    
    log_info "Deleting Secrets Manager secret: $secret_name"
    
    # Delete the secret (with recovery window of 0 for immediate deletion)
    aws secretsmanager delete-secret \
        --secret-id "$secret_name" \
        --force-delete-without-recovery \
        --region "$AWS_REGION"
    
    log_success "Secrets Manager secret deleted: $secret_name"
}

# Check if ECR repository exists
check_ecr_repository_exists() {
    local repository_name="$1"
    
    if aws ecr describe-repositories --repository-names "$repository_name" --region "$AWS_REGION" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete ECR repository and all images
delete_ecr_repository() {
    local repository_name="$1"
    
    log_info "Deleting ECR repository and all images: $repository_name"
    
    # Get all image digests
    local image_digests
    image_digests=$(aws ecr describe-images \
        --repository-name "$repository_name" \
        --region "$AWS_REGION" \
        --query 'imageDetails[*].imageDigest' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$image_digests" ]; then
        log_info "Deleting all images from repository..."
        
        # Create batch delete input
        local batch_delete_input="/tmp/batch-delete-${repository_name}.json"
        cat > "$batch_delete_input" << EOF
{
  "imageIds": [
EOF
        
        for digest in $image_digests; do
            echo "    {\"imageDigest\": \"$digest\"}," >> "$batch_delete_input"
        done
        
        # Remove trailing comma and close JSON
        sed -i '' '$ s/,$//' "$batch_delete_input"
        cat >> "$batch_delete_input" << EOF
  ]
}
EOF
        
        # Delete all images
        aws ecr batch-delete-image \
            --repository-name "$repository_name" \
            --image-ids file://"$batch_delete_input" \
            --region "$AWS_REGION"
        
        # Clean up temporary file
        rm -f "$batch_delete_input"
        
        log_success "All images deleted from repository: $repository_name"
    fi
    
    # Delete the repository
    aws ecr delete-repository \
        --repository-name "$repository_name" \
        --region "$AWS_REGION"
    
    log_success "ECR repository deleted: $repository_name"
}

# Cleanup single environment
cleanup_environment() {
    local env="$1"
    local service_name="${APP_NAME}-${env}"
    local access_role_name="AppRunnerAccessRole-${APP_NAME}-${env}"
    local instance_role_name="AppRunnerInstanceRole-${APP_NAME}-${env}"
    local secret_name="/secrets/${env}-${APP_NAME}"
    
    log_info "Cleaning up environment: $env"
    
    # 1. Delete App Runner service (depends on IAM roles)
    if check_app_runner_service_exists "$service_name"; then
        delete_app_runner_service "$service_name"
    else
        log_info "App Runner service not found: $service_name"
    fi
    
    # 2. Delete IAM roles (after App Runner service is deleted)
    if check_iam_role_exists "$access_role_name"; then
        delete_iam_role "$access_role_name"
    else
        log_info "IAM role not found: $access_role_name"
    fi
    
    if check_iam_role_exists "$instance_role_name"; then
        delete_iam_role "$instance_role_name"
    else
        log_info "IAM role not found: $instance_role_name"
    fi
    
    # 3. Delete Secrets Manager secret
    if check_secret_exists "$secret_name"; then
        delete_secret "$secret_name"
    else
        log_info "Secrets Manager secret not found: $secret_name"
    fi
    
    log_success "Environment cleanup completed: $env"
}

# Cleanup ECR repository (shared across environments)
cleanup_ecr_repository() {
    log_info "Cleaning up ECR repository: $ECR_REPOSITORY_NAME"
    
    if check_ecr_repository_exists "$ECR_REPOSITORY_NAME"; then
        delete_ecr_repository "$ECR_REPOSITORY_NAME"
    else
        log_info "ECR repository not found: $ECR_REPOSITORY_NAME"
    fi
}

# Main cleanup function
cleanup() {
    log_info "Starting cleanup process..."
    
    get_aws_account_id
    
    if [[ "$ENVIRONMENT" == "all" ]]; then
        log_info "Cleaning up all environments..."
        
        # Cleanup all environments
        for env in "${VALID_ENVIRONMENTS[@]}"; do
            cleanup_environment "$env"
        done
        
        # Cleanup shared ECR repository
        cleanup_ecr_repository
    else
        log_info "Cleaning up environment: $ENVIRONMENT"
        
        # Cleanup specific environment
        cleanup_environment "$ENVIRONMENT"
        
        # Ask if user wants to cleanup ECR repository too
        echo
        read -p "Do you want to also delete the ECR repository and all images? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup_ecr_repository
        else
            log_info "ECR repository cleanup skipped."
        fi
    fi
    
    echo
    log_success "🎉 Cleanup completed successfully!"
    echo
    log_info "Cleanup Summary:"
    if [[ "$ENVIRONMENT" == "all" ]]; then
        echo "  - All environments cleaned up"
        echo "  - ECR repository deleted"
    else
        echo "  - Environment: $ENVIRONMENT"
        echo "  - ECR repository: User choice"
    fi
    echo
    log_note "💡 Next steps:"
    echo "  - Verify resources are deleted in AWS Console"
    echo "  - Check for any remaining resources manually"
    echo "  - Consider cleaning up any associated CloudWatch logs"
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Histowalk - AWS Cleanup Tool        ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
    
    # Handle help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    # Check for force flag
    FORCE_CLEANUP=false
    if [[ "$*" == *"--force"* ]]; then
        FORCE_CLEANUP=true
    fi
    
    # Validate parameters and get user input
    select_environment "${1:-}"
    
    echo
    log_info "AWS Configuration:"
    echo "  - AWS Region: $AWS_REGION"
    echo "  - ECR Repository: $ECR_REPOSITORY_NAME"
    echo "  - Environment: $ENVIRONMENT"
    
    # Important warning
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                         ⚠️  WARNING ⚠️                          ║${NC}"
    echo -e "${RED}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║ This will PERMANENTLY DELETE all resources for:               ║${NC}"
    if [[ "$ENVIRONMENT" == "all" ]]; then
        echo -e "${RED}║ - ALL environments (develop, qa, prod)                      ║${NC}"
    else
        echo -e "${RED}║ - Environment: $ENVIRONMENT                                    ║${NC}"
    fi
    echo -e "${RED}║                                                                ║${NC}"
    echo -e "${RED}║ Resources to be deleted:                                        ║${NC}"
    echo -e "${RED}║ - App Runner services                                            ║${NC}"
    echo -e "${RED}║ - IAM roles and policies                                         ║${NC}"
    echo -e "${RED}║ - Secrets Manager secrets                                        ║${NC}"
    if [[ "$ENVIRONMENT" != "all" ]]; then
        echo -e "${RED}║ - ECR repository and images (optional)                        ║${NC}"
    else
        echo -e "${RED}║ - ECR repository and images                                   ║${NC}"
    fi
    echo -e "${RED}║ - All associated data                                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Execute cleanup pipeline
    check_prerequisites
    
    if [[ "$FORCE_CLEANUP" == "true" ]]; then
        log_warning "Force cleanup enabled - skipping confirmation prompts!"
    else
        echo
        log_warning "Ready to cleanup $ENVIRONMENT environment."
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled by user."
            exit 0
        fi
        
        # Double confirmation for production
        if [[ "$ENVIRONMENT" == "prod" || "$ENVIRONMENT" == "all" ]]; then
            echo
            log_error "⚠️  PRODUCTION CLEANUP - Double confirmation required!"
            read -p "Type 'DELETE' to confirm production cleanup: " -r
            if [[ "$REPLY" != "DELETE" ]]; then
                log_info "Production cleanup cancelled."
                exit 0
            fi
        fi
    fi
    
    echo
    cleanup
}

# Run main function with all arguments
main "$@" 