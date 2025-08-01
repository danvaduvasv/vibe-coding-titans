#!/bin/bash

# ChronoGuide - Deploy Version Script
# This script deploys specific versions to AWS App Runner environments

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
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-chronoguide}"
APP_NAME="chronoguide"

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

# Create or get App Runner access IAM role (for ECR access)
create_or_get_access_role() {
    ACCESS_ROLE_NAME="AppRunnerAccessRole-${APP_NAME}-${ENVIRONMENT}"
    
    log_info "Checking for App Runner access IAM role: $ACCESS_ROLE_NAME"
    
    # Check if role exists
    if aws iam get-role --role-name "$ACCESS_ROLE_NAME" >/dev/null 2>&1; then
        log_success "Access IAM role already exists: $ACCESS_ROLE_NAME"
    else
        log_info "Creating App Runner access IAM role: $ACCESS_ROLE_NAME"
        
        # Create trust policy for App Runner
        local trust_policy="/tmp/apprunner-access-trust-policy.json"
        cat > "$trust_policy" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create the role
        aws iam create-role \
            --role-name "$ACCESS_ROLE_NAME" \
            --assume-role-policy-document "file://$trust_policy" \
            --description "IAM role for App Runner to access ECR registry" \
            --region "$AWS_REGION" >/dev/null
        
        # Attach AWS managed policy for ECR access
        aws iam attach-role-policy \
            --role-name "$ACCESS_ROLE_NAME" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess" \
            --region "$AWS_REGION"
        
        # Wait for role to be available
        log_info "Waiting for access IAM role to be available..."
        sleep 10
        
        # Clean up temporary files
        rm -f "$trust_policy"
        
        log_success "Access IAM role created successfully: $ACCESS_ROLE_NAME"
    fi
    
    # Get role ARN
    ACCESS_ROLE_ARN=$(aws iam get-role \
        --role-name "$ACCESS_ROLE_NAME" \
        --region "$AWS_REGION" \
        --query 'Role.Arn' \
        --output text)
    
    log_info "Access role ARN: $ACCESS_ROLE_ARN"
}

# Create or get App Runner instance IAM role
create_or_get_instance_role() {
    INSTANCE_ROLE_NAME="AppRunnerInstanceRole-${APP_NAME}-${ENVIRONMENT}"
    
    log_info "Checking for App Runner instance IAM role: $INSTANCE_ROLE_NAME"
    
    # Check if role exists
    if aws iam get-role --role-name "$INSTANCE_ROLE_NAME" >/dev/null 2>&1; then
        log_success "IAM role already exists: $INSTANCE_ROLE_NAME"
    else
        log_info "Creating App Runner instance IAM role: $INSTANCE_ROLE_NAME"
        
        # Create trust policy for App Runner
        local trust_policy="/tmp/apprunner-trust-policy.json"
        cat > "$trust_policy" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create the role
        aws iam create-role \
            --role-name "$INSTANCE_ROLE_NAME" \
            --assume-role-policy-document "file://$trust_policy" \
            --description "IAM role for App Runner service instances to access Secrets Manager" \
            --region "$AWS_REGION" >/dev/null
        
        # Create policy for Secrets Manager access
        local policy_document="/tmp/apprunner-policy.json"
        cat > "$policy_document" << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:/secrets/*"
    }
  ]
}
EOF
        
        # Attach policy to role
        aws iam put-role-policy \
            --role-name "$INSTANCE_ROLE_NAME" \
            --policy-name "SecretsManagerAccess" \
            --policy-document "file://$policy_document" \
            --region "$AWS_REGION"
        
        # Wait for role to be available
        log_info "Waiting for IAM role to be available..."
        sleep 10
        
        # Clean up temporary files
        rm -f "$trust_policy" "$policy_document"
        
        log_success "IAM role created successfully: $INSTANCE_ROLE_NAME"
    fi
    
    # Get role ARN
    INSTANCE_ROLE_ARN=$(aws iam get-role \
        --role-name "$INSTANCE_ROLE_NAME" \
        --region "$AWS_REGION" \
        --query 'Role.Arn' \
        --output text)
    
    log_info "Instance role ARN: $INSTANCE_ROLE_ARN"
}

# Print usage
usage() {
    echo "Usage: $0 [ENVIRONMENT] [VERSION]"
    echo
    echo "Parameters (optional - will prompt if not provided):"
    echo "  ENVIRONMENT    Target environment (develop, qa, prod)"
    echo "  VERSION        Version tag to deploy (e.g., v1.2.3)"
    echo
    echo "Environment variables:"
    echo "  AWS_REGION              AWS region (default: eu-west-1)"
    echo "  ECR_REPOSITORY_NAME     ECR repository name (default: chronoguide)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive mode (recommended)"
    echo "  $0 develop              # Interactive version selection for develop"
    echo "  $0 develop v1.2.3       # Deploy v1.2.3 to develop environment"
    echo "  $0 qa v2.0.0            # Deploy v2.0.0 to QA environment"
    echo "  $0 prod v1.5.2          # Deploy v1.5.2 to production"
    echo
    echo "Prerequisites:"
    echo "  - AWS CLI configured with appropriate permissions"
    echo "  - App Runner service creation/update permissions"
    echo "  - ECR read permissions"
    echo "  - Secrets Manager read permissions"
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
        log_info "Select target environment:"
        echo "1) develop  - Development environment"
        echo "2) qa       - Quality Assurance environment" 
        echo "3) prod     - Production environment"
        echo
        
        while true; do
            read -p "Enter choice (1-3): " choice
            case $choice in
                1) ENVIRONMENT="develop"; break ;;
                2) ENVIRONMENT="qa"; break ;;
                3) ENVIRONMENT="prod"; break ;;
                *) log_error "Invalid choice. Please enter 1, 2, or 3." ;;
            esac
        done
        
        log_info "Selected environment: $ENVIRONMENT"
    fi
}

# Interactive version selection
select_version() {
    if [ -n "${1:-}" ]; then
        VERSION="$1"
        # Validate provided version format
        if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_error "Invalid version format: $VERSION"
            log_error "Version must be in format vX.Y.Z (e.g., v1.2.3)"
            exit 1
        fi
        log_info "Using provided version: $VERSION"
    else
        echo
        log_info "Fetching available versions..."
        
        # Fetch latest tags from remote
        git fetch --tags >/dev/null 2>&1 || true
        
        # Get the latest tag as default
        latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
        
        # Get last 10 tags for display
        available_tags=$(git tag -l --sort=-version:refname | head -10 | tr '\n' ' ')
        
        echo
        log_info "Recent available versions:"
        if [ -n "$available_tags" ]; then
            echo "  $available_tags"
        else
            echo "  No tags found"
        fi
        echo
        log_info "Latest version: $latest_tag"
        echo
        
        while true; do
            read -p "Enter version to deploy (default: $latest_tag): " input_version
            
            # Use default if no input provided
            if [ -z "$input_version" ]; then
                VERSION="$latest_tag"
            else
                VERSION="$input_version"
            fi
            
            # Validate version format
            if [[ $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                break
            else
                log_error "Invalid version format: $VERSION"
                log_error "Version must be in format vX.Y.Z (e.g., v1.2.3)"
                echo
            fi
        done
        
        log_info "Selected version: $VERSION"
    fi
}

# Validate input parameters
validate_parameters() {
    # Check if too many arguments provided
    if [ $# -gt 2 ]; then
        log_error "Too many arguments provided."
        usage
        exit 1
    fi
    
    # Interactive environment selection
    select_environment "${1:-}"
    
    # Interactive version selection  
    select_version "${2:-}"
    
    echo
    log_info "Deployment Configuration:"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Version: $VERSION"
}

# Check required tools and permissions
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v git >/dev/null 2>&1; then
        missing_tools+=("git")
    fi
    
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
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a Git repository."
        exit 1
    fi
    
    log_success "All prerequisites met!"
}

# Validate version exists in Git tags
validate_git_tag() {
    log_info "Validating Git tag: $VERSION"
    
    # Fetch latest tags from remote
    log_info "Fetching latest tags from remote..."
    git fetch --tags >/dev/null 2>&1 || true
    
    # Check if tag exists
    if ! git rev-parse "$VERSION" >/dev/null 2>&1; then
        log_error "Git tag '$VERSION' not found."
        log_info "Available tags:"
        git tag -l | tail -10
        exit 1
    fi
    
    log_success "Git tag '$VERSION' exists."
}

# Get AWS account ID and build ECR URI
get_aws_info() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    ECR_IMAGE_URI="$ECR_REGISTRY/$ECR_REPOSITORY_NAME:$VERSION"
    
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
    log_info "ECR Registry: $ECR_REGISTRY"
    log_info "ECR Image URI: $ECR_IMAGE_URI"
}

# Validate version exists in ECR
validate_ecr_image() {
    log_info "Validating ECR image: $ECR_IMAGE_URI"
    
    # Check if ECR repository exists
    if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
        log_error "ECR repository '$ECR_REPOSITORY_NAME' not found in region $AWS_REGION."
        log_error "Please run the package-and-publish.sh script first to create the repository and push images."
        exit 1
    fi
    
    # Check if specific image tag exists
    if ! aws ecr describe-images \
        --repository-name "$ECR_REPOSITORY_NAME" \
        --image-ids imageTag="$VERSION" \
        --region "$AWS_REGION" >/dev/null 2>&1; then
        log_error "Image tag '$VERSION' not found in ECR repository '$ECR_REPOSITORY_NAME'."
        log_info "Available image tags:"
        aws ecr describe-images \
            --repository-name "$ECR_REPOSITORY_NAME" \
            --region "$AWS_REGION" \
            --query 'imageDetails[*].imageTags' \
            --output table 2>/dev/null || echo "No images found"
        exit 1
    fi
    
    log_success "ECR image '$VERSION' exists and is ready for deployment."
}

# Check secrets manager secret
check_secrets_manager() {
    SECRET_NAME="/secrets/${ENVIRONMENT}-chronoguide"
    log_info "Checking Secrets Manager secret: $SECRET_NAME"
    
    # Get the actual secret ARN for App Runner (includes the 6-character suffix)
    if ! SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'ARN' --output text 2>/dev/null); then
        log_error "Secret '$SECRET_NAME' not found in AWS Secrets Manager."
        echo
        log_note "📝 IMPORTANT: You need to manually create the secret before deployment!"
        echo
        echo -e "${YELLOW}To create the secret, run:${NC}"
        echo "aws secretsmanager create-secret \\"
        echo "  --name '$SECRET_NAME' \\"
        echo "  --description 'Environment variables for ChronoGuide $ENVIRONMENT environment' \\"
        echo "  --secret-string '{\"VITE_GEOAPIFY_API_KEY\":\"your-key\"}' \\"
        echo "  --region '$AWS_REGION'"
        echo
        echo -e "${YELLOW}Or update an existing secret:${NC}"
        echo "aws secretsmanager update-secret \\"
        echo "  --secret-id '$SECRET_NAME' \\"
        echo "  --secret-string '{\"VITE_GEOAPIFY_API_KEY\":\"your-key\"}' \\"
        echo "  --region '$AWS_REGION'"
        echo
        exit 1
    fi
    
    log_success "Secret '$SECRET_NAME' exists and is accessible."
    log_info "Secret ARN: $SECRET_ARN"
}

# Generate App Runner service name
get_service_name() {
    SERVICE_NAME="${APP_NAME}-${ENVIRONMENT}"
    log_info "App Runner service name: $SERVICE_NAME"
}

# Create App Runner service configuration
create_apprunner_config() {
    local config_file="/tmp/apprunner-config-${ENVIRONMENT}.json"
    
    log_info "Creating App Runner service configuration..."
    
    cat > "$config_file" << EOF
{
  "ServiceName": "$SERVICE_NAME",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_IMAGE_URI",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentSecrets": {
          "VITE_OPENAI_API_KEY": "${SECRET_ARN}:VITE_OPENAI_API_KEY",
          "VITE_GEOAPIFY_API_KEY": "${SECRET_ARN}:VITE_GEOAPIFY_API_KEY"
        },
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "8080"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AuthenticationConfiguration": {
      "AccessRoleArn": "$ACCESS_ROLE_ARN"
    },
    "AutoDeploymentsEnabled": false
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "$INSTANCE_ROLE_ARN"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  },
  "Tags": [
    {
      "Key": "Environment",
      "Value": "$ENVIRONMENT"
    },
    {
      "Key": "Version",
      "Value": "$VERSION"
    },
    {
      "Key": "Application",
      "Value": "$APP_NAME"
    },
    {
      "Key": "ManagedBy",
      "Value": "deploy-script"
    }
  ]
}
EOF
    
    APPRUNNER_CONFIG_FILE="$config_file"
    log_success "App Runner configuration created: $config_file"
}

# Check if App Runner service exists
check_service_exists() {
    log_info "Checking if App Runner service exists: $SERVICE_NAME"
    
    if aws apprunner describe-service --service-arn "arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${SERVICE_NAME}" --region "$AWS_REGION" >/dev/null 2>&1; then
        SERVICE_EXISTS=true
        log_info "Service '$SERVICE_NAME' already exists. Will update it."
    else
        SERVICE_EXISTS=false
        log_info "Service '$SERVICE_NAME' does not exist. Will create it."
    fi
}

# Create new App Runner service
create_service() {
    log_info "Creating new App Runner service: $SERVICE_NAME"
    
    local service_arn
    service_arn=$(aws apprunner create-service \
        --cli-input-json "file://$APPRUNNER_CONFIG_FILE" \
        --region "$AWS_REGION" \
        --query 'Service.ServiceArn' \
        --output text)
    
    log_success "App Runner service created: $service_arn"
    
    # Wait for service to be running
    wait_for_service_ready "$service_arn"
}

# Update existing App Runner service
update_service() {
    local service_arn="arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${SERVICE_NAME}"
    
    log_info "Updating App Runner service: $SERVICE_NAME"
    
    # Create update configuration (subset of create config)
    local update_config="/tmp/apprunner-update-${ENVIRONMENT}.json"
    cat > "$update_config" << EOF
{
  "ServiceArn": "$service_arn",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_IMAGE_URI",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentSecrets": {
          "VITE_OPENAI_API_KEY": "${SECRET_ARN}:VITE_OPENAI_API_KEY::",
          "VITE_GEOAPIFY_API_KEY": "${SECRET_ARN}:VITE_GEOAPIFY_API_KEY::"
        },
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "npm_package_version": "${VERSION}",
          "PORT": "8080"
        }
      }
    },
    "AuthenticationConfiguration": {
      "AccessRoleArn": "$ACCESS_ROLE_ARN"
    }
  },
  "InstanceConfiguration": {
    "InstanceRoleArn": "$INSTANCE_ROLE_ARN"
  }
}
EOF
    
    aws apprunner update-service \
        --cli-input-json "file://$update_config" \
        --region "$AWS_REGION" \
        --query 'Service.ServiceArn' \
        --output text
    
    log_success "App Runner service update initiated."
    
    # Wait for service to be running
    wait_for_service_ready "$service_arn"
    
    # Cleanup
    rm -f "$update_config"
}

# Wait for service to be ready
wait_for_service_ready() {
    local service_arn="$1"
    local max_wait=600  # 10 minutes
    local wait_time=0
    
    log_info "Waiting for service to be ready (this may take several minutes)..."
    
    while [ $wait_time -lt $max_wait ]; do
        local status
        status=$(aws apprunner describe-service \
            --service-arn "$service_arn" \
            --region "$AWS_REGION" \
            --query 'Service.Status' \
            --output text)
        
        case $status in
            "RUNNING")
                log_success "Service is running!"
                return 0
                ;;
            "CREATE_FAILED"|"UPDATE_FAILED"|"DELETE_FAILED")
                log_error "Service deployment failed with status: $status"
                return 1
                ;;
            *)
                echo -n "."
                sleep 10
                wait_time=$((wait_time + 10))
                ;;
        esac
    done
    
    log_error "Timeout waiting for service to be ready."
    return 1
}

# Get service URL
get_service_url() {
    local service_arn="arn:aws:apprunner:${AWS_REGION}:${AWS_ACCOUNT_ID}:service/${SERVICE_NAME}"
    
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$service_arn" \
        --region "$AWS_REGION" \
        --query 'Service.ServiceUrl' \
        --output text)
    
    log_info "Service URL: https://$SERVICE_URL"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment health check..."
    
    local health_url="https://$SERVICE_URL/health"
    local max_attempts=6
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$health_url" >/dev/null 2>&1; then
            log_success "Health check passed! ✅"
            curl -s "$health_url" | python3 -m json.tool 2>/dev/null || echo "Health check returned non-JSON response"
            return 0
        fi
        
        log_info "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_warning "Health check failed after $max_attempts attempts. Service may still be starting up."
    return 1
}

# Cleanup temporary files
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$APPRUNNER_CONFIG_FILE" 2>/dev/null || true
}

# Main deployment function
deploy() {
    log_info "Starting deployment of $VERSION to $ENVIRONMENT environment..."
    
    create_apprunner_config
    check_service_exists
    
    if [ "$SERVICE_EXISTS" = true ]; then
        update_service
    else
        create_service
    fi
    
    get_service_url
    test_deployment
    
    echo
    log_success "🎉 Deployment completed successfully!"
    echo
    log_info "Deployment Summary:"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Version: $VERSION"
    echo "  - Service: $SERVICE_NAME"
    echo "  - Image: $ECR_IMAGE_URI"
    echo "  - URL: https://$SERVICE_URL"
    echo "  - Health Check: https://$SERVICE_URL/health"
    echo
    log_note "💡 Next steps:"
    echo "  - Test your application at: https://$SERVICE_URL"
    echo "  - Monitor service status in AWS Console"
    echo "  - Check logs if there are any issues"
    echo "  - Consider setting up custom domain and SSL certificate"
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        ChronoGuide - Deployment Tool         ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
    
    # Handle help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    # Validate parameters and get user input
    validate_parameters "$@"
    
    echo
    log_info "AWS Configuration:"
    echo "  - AWS Region: $AWS_REGION"
    echo "  - ECR Repository: $ECR_REPOSITORY_NAME"
    
    # Important note about secrets
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                         IMPORTANT NOTE                         ║${NC}"
    echo -e "${PURPLE}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${PURPLE}║ This script requires a secret in AWS Secrets Manager at:      ║${NC}"
    echo -e "${PURPLE}║ /secrets/${ENVIRONMENT}-chronoguide                                    ║${NC}"
    echo -e "${PURPLE}║                                                                ║${NC}"
    echo -e "${PURPLE}║ The secret must contain your API keys as JSON:                ║${NC}"
    echo -e "${PURPLE}║ {                                                              ║${NC}"
    echo -e "${PURPLE}║   \"VITE_OPENAI_API_KEY\": \"your-openai-key\",                   ║${NC}"
    echo -e "${PURPLE}║   \"VITE_GEOAPIFY_API_KEY\": \"your-geoapify-key\",                 ║${NC}"
    echo -e "${PURPLE}║ }                                                              ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Trap for cleanup
    trap cleanup EXIT
    
    # Execute deployment pipeline
    check_prerequisites
    validate_git_tag
    get_aws_info
    validate_ecr_image
    check_secrets_manager
    get_service_name
    create_or_get_access_role
    create_or_get_instance_role
    
    echo
    log_warning "Ready to deploy $VERSION to $ENVIRONMENT environment."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user."
        exit 0
    fi
    
    echo
    deploy
}

# Run main function with all arguments
main "$@" 