#!/bin/bash

# Histowalk - Package and Publish Script
# This script tags Git code, builds Docker image, and publishes to AWS ECR or Azure ACR
#
# =============================================================================
# AZURE SETUP INSTRUCTIONS
# =============================================================================
# 
# To use Azure Container Registry (ACR), you need to:
#
# 1. INSTALL AZURE CLI:
#    - macOS: brew install azure-cli
#    - Ubuntu/Debian: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
#    - Windows: Download from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
#    - Or visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
#
# 2. AUTHENTICATE WITH AZURE:
#    az login
#    # This will open a browser window for authentication
#
# 3. SET YOUR SUBSCRIPTION (if you have multiple):
#    az account list --output table
#    az account set --subscription "<subscription-id>"
#
# 4. ENSURE YOU HAVE PROPER PERMISSIONS:
#    - Contributor or Owner role on the subscription
#    - Or at minimum: Contributor role on the resource group
#    - To check roles: az role assignment list --assignee <your-email>
#
# 5. OPTIONAL: CREATE A SERVICE PRINCIPAL (for CI/CD):
#    az ad sp create-for-rbac --name "histowalk-sp" --role contributor \
#        --scopes /subscriptions/<subscription-id> \
#        --sdk-auth
#
# 6. RUN THE SCRIPT WITH AZURE:
#    CLOUD_PROVIDER=azure ./scripts/package-and-publish.sh v1.0.0
#
# =============================================================================
# AZURE RESOURCES CREATED
# =============================================================================
#
# The script will automatically create:
# - Resource Group: histowalk-rg (or custom name)
# - Container Registry: histowalkacr (or custom name)
# - Location: westeurope (or custom location)
# - SKU: Basic (or Standard/Premium)
#
# =============================================================================
# AZURE DEPLOYMENT OPTIONS
# =============================================================================
#
# After pushing to ACR, you can deploy to:
#
# 1. AZURE APP SERVICE (Web App for Containers):
#    az webapp create --resource-group histowalk-rg --plan histowalk-plan \
#        --name histowalk-app --deployment-local-git
#    az webapp config container set --name histowalk-app \
#        --resource-group histowalk-rg \
#        --docker-custom-image-name histowalkacr.azurecr.io/histowalk:v1.0.0
#
# 2. AZURE CONTAINER INSTANCES:
#    az container create --resource-group histowalk-rg \
#        --name histowalk-container \
#        --image histowalkacr.azurecr.io/histowalk:v1.0.0 \
#        --dns-name-label histowalk-app \
#        --ports 80
#
# 3. AZURE KUBERNETES SERVICE (AKS):
#    az aks create --resource-group histowalk-rg --name histowalk-aks \
#        --node-count 1 --enable-addons monitoring --generate-ssh-keys
#    az aks get-credentials --resource-group histowalk-rg --name histowalk-aks
#    # Then use kubectl to deploy your container
#
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - can be overridden by environment variables
# Cloud provider selection (aws or azure)
CLOUD_PROVIDER="${CLOUD_PROVIDER:-aws}"

# AWS Configuration
AWS_REGION="${AWS_REGION:-eu-west-1}"
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-histowalk}"

# Azure Configuration
AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-histowalk-rg}"
AZURE_LOCATION="${AZURE_LOCATION:-westeurope}"
ACR_NAME="${ACR_NAME:-histowalkacr}"
ACR_SKU="${ACR_SKU:-Basic}"  # Basic, Standard, Premium

# Common Configuration
IMAGE_NAME="${IMAGE_NAME:-histowalk}"
DOCKERFILE_PATH="${DOCKERFILE_PATH:-./Dockerfile}"

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

# Check required tools
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v git >/dev/null 2>&1; then
        missing_tools+=("git")
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        missing_tools+=("docker")
    fi
    
    # Check cloud-specific tools
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        if ! command -v aws >/dev/null 2>&1; then
            missing_tools+=("aws-cli")
        fi
        
        # Check AWS credentials
        if ! aws sts get-caller-identity >/dev/null 2>&1; then
            log_error "AWS credentials not configured or invalid."
            log_error "Please run 'aws configure' or set AWS environment variables."
            exit 1
        fi
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        if ! command -v az >/dev/null 2>&1; then
            missing_tools+=("azure-cli")
        fi
        
        # Check Azure login
        if ! az account show >/dev/null 2>&1; then
            log_error "Azure CLI not logged in or no subscription selected."
            log_error "Please run 'az login' and 'az account set --subscription <subscription-id>'"
            exit 1
        fi
        
        # Set subscription if provided
        if [[ -n "$AZURE_SUBSCRIPTION_ID" ]]; then
            log_info "Setting Azure subscription: $AZURE_SUBSCRIPTION_ID"
            az account set --subscription "$AZURE_SUBSCRIPTION_ID"
        fi
    else
        log_error "Invalid cloud provider: $CLOUD_PROVIDER. Use 'aws' or 'azure'."
        exit 1
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        echo
        if [[ "$CLOUD_PROVIDER" == "azure" ]]; then
            log_info "For Azure, you need to install:"
            echo "  - Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            echo "  - Docker: https://docs.docker.com/get-docker/"
            echo "  - Git: https://git-scm.com/downloads"
            echo
            log_info "After installation:"
            echo "  1. Run 'az login' to authenticate with Azure"
            echo "  2. Run 'az account set --subscription <your-subscription-id>' to set active subscription"
            echo "  3. Ensure you have Contributor or Owner role on the subscription/resource group"
        fi
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a Git repository."
        exit 1
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "You have uncommitted changes. Please commit or stash them before tagging."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_success "All prerequisites met!"
}

# Get the next version tag
get_version() {
    if [ $# -eq 1 ]; then
        VERSION="$1"
        log_info "Using provided version: $VERSION"
    else
        # Get the latest tag
        latest_tag=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
        log_info "Latest tag: $latest_tag"
        
        # Extract version numbers
        if [[ $latest_tag =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
            major=${BASH_REMATCH[1]}
            minor=${BASH_REMATCH[2]}
            patch=${BASH_REMATCH[3]}
        else
            major=0
            minor=0
            patch=0
        fi
        
        # Suggest next version
        next_patch="v$major.$minor.$((patch + 1))"
        next_minor="v$major.$((minor + 1)).0"
        next_major="v$((major + 1)).0.0"
        
        echo -e "\nSelect version increment:"
        echo "1) Patch: $next_patch (bug fixes)"
        echo "2) Minor: $next_minor (new features)"
        echo "3) Major: $next_major (breaking changes)"
        echo "4) Custom version"
        
        read -p "Enter choice (1-4): " choice
        
        case $choice in
            1) VERSION=$next_patch ;;
            2) VERSION=$next_minor ;;
            3) VERSION=$next_major ;;
            4) 
                read -p "Enter custom version (e.g., v1.2.3): " VERSION
                if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                    log_error "Invalid version format. Use vX.Y.Z format."
                    exit 1
                fi
                ;;
            *) 
                log_error "Invalid choice."
                exit 1
                ;;
        esac
    fi
    
    # Check if tag already exists
    if git rev-parse "$VERSION" >/dev/null 2>&1; then
        log_error "Tag $VERSION already exists."
        exit 1
    fi
    
    log_info "Selected version: $VERSION"
}

# Create Git tag
create_git_tag() {
    log_info "Creating Git tag: $VERSION"
    
    # Create annotated tag
    git tag -a "$VERSION" -m "Release $VERSION - $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Push tag to remote
    log_info "Pushing tag to remote..."
    git push origin "$VERSION"
    
    log_success "Git tag $VERSION created and pushed!"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image: $IMAGE_NAME:$VERSION"
    
    # Build with both version tag and latest for x86_64 platform
    # Note: --platform linux/amd64 ensures compatibility with AWS App Runner and most cloud platforms
    # Requires Docker BuildKit (enabled by default in Docker 23.0+) or buildx for cross-platform builds
    DOCKER_BUILDKIT=1 docker build \
        --platform linux/amd64 \
        -t "$IMAGE_NAME:$VERSION" \
        -t "$IMAGE_NAME:latest" \
        -f "$DOCKERFILE_PATH" \
        .
    
    log_success "Docker image built successfully!"
    
    # Show image info
    docker images | grep "$IMAGE_NAME" | head -2
}

# Get AWS account ID
get_aws_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    log_info "AWS Account ID: $AWS_ACCOUNT_ID"
    log_info "ECR Registry: $ECR_REGISTRY"
}

# Create ECR repository if it doesn't exist
create_ecr_repository() {
    log_info "Checking if ECR repository exists: $ECR_REPOSITORY_NAME"
    
    if aws ecr describe-repositories --repository-names "$ECR_REPOSITORY_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
        log_success "ECR repository '$ECR_REPOSITORY_NAME' already exists."
    else
        log_info "Creating ECR repository: $ECR_REPOSITORY_NAME"
        
        aws ecr create-repository \
            --repository-name "$ECR_REPOSITORY_NAME" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --image-tag-mutability MUTABLE \
            --encryption-configuration encryptionType=AES256
        
        log_success "ECR repository '$ECR_REPOSITORY_NAME' created successfully!"
        
        # Set lifecycle policy to keep only last 10 images
        log_info "Setting lifecycle policy..."
        aws ecr put-lifecycle-policy \
            --repository-name "$ECR_REPOSITORY_NAME" \
            --region "$AWS_REGION" \
            --lifecycle-policy-text '{
                "rules": [
                    {
                        "rulePriority": 1,
                        "description": "Keep last 10 images",
                        "selection": {
                            "tagStatus": "any",
                            "countType": "imageCountMoreThan",
                            "countNumber": 10
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            }'
    fi
}

# Login to ECR
ecr_login() {
    log_info "Logging in to ECR..."
    
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ECR_REGISTRY"
    
    log_success "Successfully logged in to ECR!"
}

# Tag and push image to ECR
push_to_ecr() {
    local ecr_image_uri="$ECR_REGISTRY/$ECR_REPOSITORY_NAME"
    
    log_info "Tagging image for ECR..."
    docker tag "$IMAGE_NAME:$VERSION" "$ecr_image_uri:$VERSION"
    docker tag "$IMAGE_NAME:latest" "$ecr_image_uri:latest"
    
    log_info "Pushing image to ECR: $ecr_image_uri:$VERSION"
    docker push "$ecr_image_uri:$VERSION"
    
    log_info "Pushing latest tag to ECR: $ecr_image_uri:latest"
    docker push "$ecr_image_uri:latest"
    
    log_success "Image pushed successfully to ECR!"
    echo
    log_info "Image URIs:"
    echo "  - $ecr_image_uri:$VERSION"
    echo "  - $ecr_image_uri:latest"
}

# =============================================================================
# AZURE ACR FUNCTIONS
# =============================================================================

# Create Azure resource group if it doesn't exist
create_azure_resource_group() {
    log_info "Checking if Azure resource group exists: $AZURE_RESOURCE_GROUP"
    
    if az group show --name "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_success "Azure resource group '$AZURE_RESOURCE_GROUP' already exists."
    else
        log_info "Creating Azure resource group: $AZURE_RESOURCE_GROUP in $AZURE_LOCATION"
        
        az group create \
            --name "$AZURE_RESOURCE_GROUP" \
            --location "$AZURE_LOCATION" \
            --tags "project=histowalk" "environment=production"
        
        log_success "Azure resource group '$AZURE_RESOURCE_GROUP' created successfully!"
    fi
}

# Create Azure Container Registry if it doesn't exist
create_azure_acr() {
    log_info "Checking if Azure Container Registry exists: $ACR_NAME"
    
    if az acr show --name "$ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_success "Azure Container Registry '$ACR_NAME' already exists."
    else
        log_info "Creating Azure Container Registry: $ACR_NAME"
        
        az acr create \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --name "$ACR_NAME" \
            --sku "$ACR_SKU" \
            --admin-enabled true \
            --location "$AZURE_LOCATION"
        
        log_success "Azure Container Registry '$ACR_NAME' created successfully!"
        
        # Set retention policy (keep last 10 images)
        log_info "Setting retention policy..."
        az acr task create \
            --registry "$ACR_NAME" \
            --name "cleanup-task" \
            --image "cleanup:latest" \
            --context /dev/null \
            --file /dev/null \
            --cmd "echo 'Retention policy set to keep last 10 images'"
    fi
}

# Login to Azure Container Registry
acr_login() {
    log_info "Logging in to Azure Container Registry..."
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query loginServer --output tsv)
    
    # Login to ACR
    az acr login --name "$ACR_NAME"
    
    log_success "Successfully logged in to Azure Container Registry!"
    log_info "ACR Login Server: $ACR_LOGIN_SERVER"
}

# Tag and push image to Azure ACR
push_to_acr() {
    local acr_image_uri="$ACR_LOGIN_SERVER/$IMAGE_NAME"
    
    log_info "Tagging image for Azure ACR..."
    docker tag "$IMAGE_NAME:$VERSION" "$acr_image_uri:$VERSION"
    docker tag "$IMAGE_NAME:latest" "$acr_image_uri:latest"
    
    log_info "Pushing image to Azure ACR: $acr_image_uri:$VERSION"
    docker push "$acr_image_uri:$VERSION"
    
    log_info "Pushing latest tag to Azure ACR: $acr_image_uri:latest"
    docker push "$acr_image_uri:latest"
    
    log_success "Image pushed successfully to Azure ACR!"
    echo
    log_info "Image URIs:"
    echo "  - $acr_image_uri:$VERSION"
    echo "  - $acr_image_uri:latest"
    echo
    log_info "To pull the image:"
    echo "  docker pull $acr_image_uri:$VERSION"
    echo
    log_info "To deploy to Azure App Service or Container Instances, use:"
    echo "  $acr_image_uri:$VERSION"
}

# Cleanup local images (optional)
cleanup_local_images() {
    read -p "Remove local Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up local images..."
        
        # Remove local images
        docker rmi "$IMAGE_NAME:$VERSION" "$IMAGE_NAME:latest" 2>/dev/null || true
        
        # Remove cloud-specific images
        if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
            docker rmi "$ECR_REGISTRY/$ECR_REPOSITORY_NAME:$VERSION" "$ECR_REGISTRY/$ECR_REPOSITORY_NAME:latest" 2>/dev/null || true
        elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
            docker rmi "$ACR_LOGIN_SERVER/$IMAGE_NAME:$VERSION" "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest" 2>/dev/null || true
        fi
        
        log_success "Local images cleaned up!"
    fi
}

# Print usage
usage() {
    echo "Usage: $0 [VERSION]"
    echo
    echo "Environment variables:"
    echo "  CLOUD_PROVIDER           Cloud provider: aws or azure (default: aws)"
    echo
    echo "AWS Configuration:"
    echo "  AWS_REGION              AWS region (default: eu-west-1)"
    echo "  ECR_REPOSITORY_NAME     ECR repository name (default: histowalk)"
    echo
    echo "Azure Configuration:"
    echo "  AZURE_SUBSCRIPTION_ID   Azure subscription ID"
    echo "  AZURE_RESOURCE_GROUP    Azure resource group (default: histowalk-rg)"
    echo "  AZURE_LOCATION          Azure location (default: westeurope)"
    echo "  ACR_NAME                Azure Container Registry name (default: histowalkacr)"
    echo "  ACR_SKU                 ACR SKU: Basic, Standard, Premium (default: Basic)"
    echo
    echo "Common Configuration:"
    echo "  IMAGE_NAME              Local Docker image name (default: histowalk)"
    echo "  DOCKERFILE_PATH         Path to Dockerfile (default: ./Dockerfile)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive version selection (AWS)"
    echo "  $0 v1.2.3              # Use specific version (AWS)"
    echo "  CLOUD_PROVIDER=azure $0 v1.2.3  # Use Azure ACR"
    echo "  AWS_REGION=eu-west-1 $0 v1.2.3  # Use different AWS region"
    echo "  AZURE_LOCATION=eastus CLOUD_PROVIDER=azure $0 v1.2.3  # Use different Azure location"
    echo
    echo "Prerequisites for Azure:"
    echo "  1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    echo "  2. Run 'az login' to authenticate"
    echo "  3. Run 'az account set --subscription <subscription-id>' to set active subscription"
    echo "  4. Ensure you have Contributor or Owner role on the subscription/resource group"
    echo
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           Histowalk - Release Tool         ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
    
    # Handle help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    log_info "Starting release process..."
    log_info "Configuration:"
    echo "  - Cloud Provider: $CLOUD_PROVIDER"
    
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        echo "  - AWS Region: $AWS_REGION"
        echo "  - ECR Repository: $ECR_REPOSITORY_NAME"
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        echo "  - Azure Resource Group: $AZURE_RESOURCE_GROUP"
        echo "  - Azure Location: $AZURE_LOCATION"
        echo "  - ACR Name: $ACR_NAME"
        echo "  - ACR SKU: $ACR_SKU"
    fi
    
    echo "  - Image Name: $IMAGE_NAME"
    echo "  - Dockerfile: $DOCKERFILE_PATH"
    echo
    
    # Execute pipeline
    check_prerequisites
    get_version "$@"
    
    echo
    log_warning "This will:"
    echo "  1. Create and push Git tag: $VERSION"
    echo "  2. Build Docker image: $IMAGE_NAME:$VERSION"
    
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        echo "  3. Create ECR repository if needed: $ECR_REPOSITORY_NAME"
        echo "  4. Push image to ECR in region: $AWS_REGION"
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        echo "  3. Create Azure resource group if needed: $AZURE_RESOURCE_GROUP"
        echo "  4. Create Azure Container Registry if needed: $ACR_NAME"
        echo "  5. Push image to Azure ACR in location: $AZURE_LOCATION"
    fi
    
    echo
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Aborted by user."
        exit 0
    fi
    
    echo
    create_git_tag
    build_docker_image
    
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        get_aws_account_id
        create_ecr_repository
        ecr_login
        push_to_ecr
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        create_azure_resource_group
        create_azure_acr
        acr_login
        push_to_acr
    fi
    
    cleanup_local_images
    
    echo
    log_success "🎉 Release $VERSION completed successfully!"
    echo
    log_info "Next steps:"
    
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        echo "  - Update your deployment configurations to use: $ECR_REGISTRY/$ECR_REPOSITORY_NAME:$VERSION"
        echo "  - Consider creating a GitHub release for tag: $VERSION"
        echo "  - Update your production environment"
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        echo "  - Update your deployment configurations to use: $ACR_LOGIN_SERVER/$IMAGE_NAME:$VERSION"
        echo "  - Consider creating a GitHub release for tag: $VERSION"
        echo "  - Deploy to Azure App Service, Container Instances, or AKS"
        echo "  - Example Azure App Service deployment:"
        echo "    az webapp config container set --name <app-name> --resource-group <rg-name> --docker-custom-image-name $ACR_LOGIN_SERVER/$IMAGE_NAME:$VERSION"
    fi
}

# Run main function with all arguments
main "$@" 