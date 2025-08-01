#!/bin/bash

# ChronoGuide - Package and Publish Script
# This script tags Git code, builds Docker image, and publishes to AWS ECR

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - can be overridden by environment variables
AWS_REGION="${AWS_REGION:-eu-west-1}"
ECR_REPOSITORY_NAME="${ECR_REPOSITORY_NAME:-chronoguide}"
IMAGE_NAME="${IMAGE_NAME:-chronoguide}"
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

# Cleanup local images (optional)
cleanup_local_images() {
    read -p "Remove local Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up local images..."
        docker rmi "$IMAGE_NAME:$VERSION" "$IMAGE_NAME:latest" 2>/dev/null || true
        docker rmi "$ECR_REGISTRY/$ECR_REPOSITORY_NAME:$VERSION" "$ECR_REGISTRY/$ECR_REPOSITORY_NAME:latest" 2>/dev/null || true
        log_success "Local images cleaned up!"
    fi
}

# Print usage
usage() {
    echo "Usage: $0 [VERSION]"
    echo
    echo "Environment variables:"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  ECR_REPOSITORY_NAME     ECR repository name (default: chronoguide)"
    echo "  IMAGE_NAME              Local Docker image name (default: chronoguide)"
    echo "  DOCKERFILE_PATH         Path to Dockerfile (default: ./Dockerfile)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive version selection"
    echo "  $0 v1.2.3              # Use specific version"
    echo "  AWS_REGION=eu-west-1 $0 v1.2.3  # Use different region"
    echo
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           ChronoGuide - Release Tool         ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
    echo
    
    # Handle help flag
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
        usage
        exit 0
    fi
    
    log_info "Starting release process..."
    log_info "Configuration:"
    echo "  - AWS Region: $AWS_REGION"
    echo "  - ECR Repository: $ECR_REPOSITORY_NAME"
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
    echo "  3. Create ECR repository if needed: $ECR_REPOSITORY_NAME"
    echo "  4. Push image to ECR in region: $AWS_REGION"
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
    get_aws_account_id
    create_ecr_repository
    ecr_login
    push_to_ecr
    cleanup_local_images
    
    echo
    log_success "🎉 Release $VERSION completed successfully!"
    echo
    log_info "Next steps:"
    echo "  - Update your deployment configurations to use: $ECR_REGISTRY/$ECR_REPOSITORY_NAME:$VERSION"
    echo "  - Consider creating a GitHub release for tag: $VERSION"
    echo "  - Update your production environment"
}

# Run main function with all arguments
main "$@" 