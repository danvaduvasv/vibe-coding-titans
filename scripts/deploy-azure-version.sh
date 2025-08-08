#!/bin/bash

# Histowalk - Deploy Version Script for Azure
# This script deploys specific versions to Azure Container Apps environments

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration - can be overridden by environment variables
AZURE_SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-histowalk-rg}"
AZURE_LOCATION="${AZURE_LOCATION:-westeurope}"
ACR_NAME="${ACR_NAME:-histowalkacr}"
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
    echo "Usage: $0 [ENVIRONMENT] [VERSION]"
    echo
    echo "Parameters (optional - will prompt if not provided):"
    echo "  ENVIRONMENT    Target environment (develop, qa, prod)"
    echo "  VERSION        Version tag to deploy (e.g., v1.2.3)"
    echo
    echo "Environment variables:"
    echo "  AZURE_SUBSCRIPTION_ID   Azure subscription ID"
    echo "  AZURE_RESOURCE_GROUP    Azure resource group (default: histowalk-rg)"
    echo "  AZURE_LOCATION          Azure location (default: westeurope)"
    echo "  ACR_NAME                Azure Container Registry name (default: histowalkacr)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive mode (recommended)"
    echo "  $0 develop              # Interactive version selection for develop"
    echo "  $0 develop v1.2.3       # Deploy v1.2.3 to develop environment"
    echo "  $0 qa v2.0.0            # Deploy v2.0.0 to QA environment"
    echo "  $0 prod v1.5.2          # Deploy v1.5.2 to production"
    echo
    echo "Prerequisites:"
    echo "  - Azure CLI installed and authenticated"
    echo "  - Container Apps extension installed: az extension add --name containerapp"
    echo "  - Container Registry extension installed: az extension add --name acr"
    echo "  - Appropriate Azure permissions (Contributor or Owner)"
    echo
    echo "Azure Setup Instructions:"
    echo "  1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    echo "  2. Run 'az login' to authenticate"
    echo "  3. Run 'az account set --subscription <subscription-id>' to set active subscription"
    echo "  4. Install required extensions:"
    echo "     az extension add --name containerapp"
    echo "     az extension add --name acr"
    echo "  5. Ensure you have Contributor or Owner role on the subscription/resource group"
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
    
    if ! command -v az >/dev/null 2>&1; then
        missing_tools+=("azure-cli")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        echo
        log_info "For Azure, you need to install:"
        echo "  - Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Git: https://git-scm.com/downloads"
        echo
        log_info "After installation:"
        echo "  1. Run 'az login' to authenticate with Azure"
        echo "  2. Run 'az account set --subscription <subscription-id>' to set active subscription"
        echo "  3. Install required extensions:"
        echo "     az extension add --name containerapp"
        echo "     az extension add --name acr"
        echo "  4. Ensure you have Contributor or Owner role on the subscription/resource group"
        exit 1
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
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a Git repository."
        exit 1
    fi
    
    # Check for required Azure extensions
    log_info "Checking Azure CLI extensions..."
    
    if ! az extension show --name containerapp >/dev/null 2>&1; then
        log_info "Installing Container Apps extension..."
        az extension add --name containerapp --yes
    fi
    
    if ! az extension show --name acr >/dev/null 2>&1; then
        log_info "Installing Container Registry extension..."
        az extension add --name acr --yes
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

# Get Azure subscription and build ACR URI
get_azure_info() {
    AZURE_SUBSCRIPTION_ID=$(az account show --query id --output tsv)
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" --query loginServer --output tsv 2>/dev/null || echo "")
    ACR_IMAGE_URI="$ACR_LOGIN_SERVER/$APP_NAME:$VERSION"
    
    log_info "Azure Subscription ID: $AZURE_SUBSCRIPTION_ID"
    log_info "ACR Login Server: $ACR_LOGIN_SERVER"
    log_info "ACR Image URI: $ACR_IMAGE_URI"
}

# Validate version exists in ACR
validate_acr_image() {
    log_info "Validating ACR image: $ACR_IMAGE_URI"
    
    # Check if ACR exists
    if ! az acr show --name "$ACR_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_error "Azure Container Registry '$ACR_NAME' not found in resource group '$AZURE_RESOURCE_GROUP'."
        log_error "Please run the package-and-publish.sh script first to create the registry and push images."
        exit 1
    fi
    
    # Check if specific image tag exists
    if ! az acr repository show-tags --name "$ACR_NAME" --repository "$APP_NAME" --query "[?contains(@, '$VERSION')]" --output tsv | grep -q "$VERSION"; then
        log_error "Image tag '$VERSION' not found in ACR repository '$APP_NAME'."
        log_info "Available image tags:"
        az acr repository show-tags --name "$ACR_NAME" --repository "$APP_NAME" --output table 2>/dev/null || echo "No images found"
        exit 1
    fi
    
    log_success "ACR image '$VERSION' exists and is ready for deployment."
}

# Check Azure Key Vault secret
check_key_vault() {
    KEY_VAULT_NAME="histowalk-kv-${ENVIRONMENT}"
    SECRET_NAME="histowalk-${ENVIRONMENT}-secrets"
    
    log_info "Checking Azure Key Vault: $KEY_VAULT_NAME"
    
    # Check if Key Vault exists
    if ! az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_error "Key Vault '$KEY_VAULT_NAME' not found in resource group '$AZURE_RESOURCE_GROUP'."
        echo
        log_note "📝 IMPORTANT: You need to manually create the Key Vault before deployment!"
        echo
        echo -e "${YELLOW}To create the Key Vault, run:${NC}"
        echo "az keyvault create \\"
        echo "  --name '$KEY_VAULT_NAME' \\"
        echo "  --resource-group '$AZURE_RESOURCE_GROUP' \\"
        echo "  --location '$AZURE_LOCATION' \\"
        echo "  --sku standard"
        echo
        echo -e "${YELLOW}Then add your secrets:${NC}"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_OPENAI_API_KEY' --value 'your-openai-key'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_GEOAPIFY_API_KEY' --value 'your-geoapify-key'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_MAPBOX_API_KEY' --value 'your-mapbox-key'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_ELEVENLABS_API_KEY' --value 'your-elevenlabs-key'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_ENABLE_ELEVENLABS' --value 'true'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_MEGATRON_VOICE_ID' --value 'your-megatron-voice-id'"
        echo "az keyvault secret set --vault-name '$KEY_VAULT_NAME' --name 'VITE_FREEMAN_VOICE_ID' --value 'your-freeman-voice-id'"
        echo
        exit 1
    fi
    
    log_success "Key Vault '$KEY_VAULT_NAME' exists and is accessible."
}

# Create or get managed identity for Container App
create_or_get_managed_identity() {
    MANAGED_IDENTITY_NAME="histowalk-mi-${ENVIRONMENT}"
    
    log_info "Checking for managed identity: $MANAGED_IDENTITY_NAME"
    
    # Check if managed identity exists
    if az identity show --name "$MANAGED_IDENTITY_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_success "Managed identity already exists: $MANAGED_IDENTITY_NAME"
    else
        log_info "Creating managed identity: $MANAGED_IDENTITY_NAME"
        
        az identity create \
            --name "$MANAGED_IDENTITY_NAME" \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --location "$AZURE_LOCATION"
        
        log_success "Managed identity created successfully: $MANAGED_IDENTITY_NAME"
    fi
    
    # Get managed identity principal ID
    MANAGED_IDENTITY_PRINCIPAL_ID=$(az identity show \
        --name "$MANAGED_IDENTITY_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query principalId \
        --output tsv)
    
    log_info "Managed identity principal ID: $MANAGED_IDENTITY_PRINCIPAL_ID"
}

# Assign Key Vault access to managed identity
assign_key_vault_access() {
    log_info "Assigning Key Vault access to managed identity..."
    
    # Get Key Vault resource ID
    KEY_VAULT_ID=$(az keyvault show \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query id \
        --output tsv)
    
    # Assign Key Vault Secrets User role
    az role assignment create \
        --assignee "$MANAGED_IDENTITY_PRINCIPAL_ID" \
        --role "Key Vault Secrets User" \
        --scope "$KEY_VAULT_ID" \
        --output none 2>/dev/null || log_info "Role assignment may already exist"
    
    log_success "Key Vault access assigned to managed identity."
}

# Generate Container App name
get_container_app_name() {
    CONTAINER_APP_NAME="${APP_NAME}-${ENVIRONMENT}"
    log_info "Container App name: $CONTAINER_APP_NAME"
}

# Create Container Apps environment if it doesn't exist
create_container_apps_environment() {
    ENVIRONMENT_NAME="histowalk-env-${ENVIRONMENT}"
    
    log_info "Checking if Container Apps environment exists: $ENVIRONMENT_NAME"
    
    if az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        log_success "Container Apps environment already exists: $ENVIRONMENT_NAME"
    else
        log_info "Creating Container Apps environment: $ENVIRONMENT_NAME"
        
        az containerapp env create \
            --name "$ENVIRONMENT_NAME" \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --location "$AZURE_LOCATION"
        
        log_success "Container Apps environment created successfully: $ENVIRONMENT_NAME"
    fi
}

# Check if Container App exists
check_container_app_exists() {
    log_info "Checking if Container App exists: $CONTAINER_APP_NAME"
    
    if az containerapp show --name "$CONTAINER_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        CONTAINER_APP_EXISTS=true
        log_info "Container App '$CONTAINER_APP_NAME' already exists. Will update it."
    else
        CONTAINER_APP_EXISTS=false
        log_info "Container App '$CONTAINER_APP_NAME' does not exist. Will create it."
    fi
}

# Create new Container App
create_container_app() {
    log_info "Creating new Container App: $CONTAINER_APP_NAME"
    
    # Get managed identity resource ID
    MANAGED_IDENTITY_ID=$(az identity show \
        --name "$MANAGED_IDENTITY_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query id \
        --output tsv)
    
    # Get Key Vault URI
    KEY_VAULT_URI=$(az keyvault show \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query properties.vaultUri \
        --output tsv)
    
    az containerapp create \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --environment "$ENVIRONMENT_NAME" \
        --image "$ACR_IMAGE_URI" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$(az acr credential show --name $ACR_NAME --query username --output tsv)" \
        --registry-password "$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)" \
        --target-port 8080 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.5 \
        --memory 1.0Gi \
        --env-vars NODE_ENV=production PORT=8080 \
        --user-assigned "$MANAGED_IDENTITY_ID" \
        --secrets "VITE_OPENAI_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_OPENAI_API_KEY:latest" \
        --secrets "VITE_GEOAPIFY_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_GEOAPIFY_API_KEY:latest" \
        --secrets "VITE_MAPBOX_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_MAPBOX_API_KEY:latest" \
        --secrets "VITE_ELEVENLABS_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_ELEVENLABS_API_KEY:latest" \
        --secrets "VITE_ENABLE_ELEVENLABS=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_ENABLE_ELEVENLABS:latest" \
        --secrets "VITE_MEGATRON_VOICE_ID=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_MEGATRON_VOICE_ID:latest" \
        --secrets "VITE_FREEMAN_VOICE_ID=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_FREEMAN_VOICE_ID:latest" \
        --tags Environment="$ENVIRONMENT" Version="$VERSION" Application="$APP_NAME" ManagedBy="deploy-script"
    
    log_success "Container App created successfully: $CONTAINER_APP_NAME"
}

# Update existing Container App
update_container_app() {
    log_info "Updating Container App: $CONTAINER_APP_NAME"
    
    # Get Key Vault URI
    KEY_VAULT_URI=$(az keyvault show \
        --name "$KEY_VAULT_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query properties.vaultUri \
        --output tsv)
    
    az containerapp update \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --image "$ACR_IMAGE_URI" \
        --registry-server "$ACR_LOGIN_SERVER" \
        --registry-username "$(az acr credential show --name $ACR_NAME --query username --output tsv)" \
        --registry-password "$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)" \
        --env-vars NODE_ENV=production PORT=8080 VERSION="$VERSION" \
        --secrets "VITE_OPENAI_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_OPENAI_API_KEY:latest" \
        --secrets "VITE_GEOAPIFY_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_GEOAPIFY_API_KEY:latest" \
        --secrets "VITE_MAPBOX_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_MAPBOX_API_KEY:latest" \
        --secrets "VITE_ELEVENLABS_API_KEY=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_ELEVENLABS_API_KEY:latest" \
        --secrets "VITE_ENABLE_ELEVENLABS=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_ENABLE_ELEVENLABS:latest" \
        --secrets "VITE_MEGATRON_VOICE_ID=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_MEGATRON_VOICE_ID:latest" \
        --secrets "VITE_FREEMAN_VOICE_ID=keyvaultref:${KEY_VAULT_URI}:secrets:VITE_FREEMAN_VOICE_ID:latest"
    
    log_success "Container App update initiated."
}

# Wait for Container App to be ready
wait_for_container_app_ready() {
    local max_wait=600  # 10 minutes
    local wait_time=0
    
    log_info "Waiting for Container App to be ready (this may take several minutes)..."
    
    while [ $wait_time -lt $max_wait ]; do
        local provisioning_state
        provisioning_state=$(az containerapp show \
            --name "$CONTAINER_APP_NAME" \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --query properties.provisioningState \
            --output tsv)
        
        case $provisioning_state in
            "Succeeded")
                log_success "Container App is ready!"
                return 0
                ;;
            "Failed")
                log_error "Container App deployment failed with state: $provisioning_state"
                return 1
                ;;
            *)
                echo -n "."
                sleep 10
                wait_time=$((wait_time + 10))
                ;;
        esac
    done
    
    log_error "Timeout waiting for Container App to be ready."
    return 1
}

# Get Container App URL
get_container_app_url() {
    CONTAINER_APP_URL=$(az containerapp show \
        --name "$CONTAINER_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --query properties.configuration.ingress.fqdn \
        --output tsv)
    
    log_info "Container App URL: https://$CONTAINER_APP_URL"
}

# Test deployment
test_deployment() {
    log_info "Testing deployment health check..."
    
    local health_url="https://$CONTAINER_APP_URL/health"
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
    
    log_warning "Health check failed after $max_attempts attempts. Container App may still be starting up."
    return 1
}

# Main deployment function
deploy() {
    log_info "Starting deployment of $VERSION to $ENVIRONMENT environment..."
    
    get_container_app_name
    create_container_apps_environment
    check_container_app_exists
    
    if [ "$CONTAINER_APP_EXISTS" = true ]; then
        update_container_app
    else
        create_container_app
    fi
    
    wait_for_container_app_ready
    get_container_app_url
    test_deployment
    
    echo
    log_success "🎉 Deployment completed successfully!"
    echo
    log_info "Deployment Summary:"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Version: $VERSION"
    echo "  - Container App: $CONTAINER_APP_NAME"
    echo "  - Image: $ACR_IMAGE_URI"
    echo "  - URL: https://$CONTAINER_APP_URL"
    echo "  - Health Check: https://$CONTAINER_APP_URL/health"
    echo
    log_note "💡 Next steps:"
    echo "  - Test your application at: https://$CONTAINER_APP_URL"
    echo "  - Monitor Container App status in Azure Portal"
    echo "  - Check logs if there are any issues"
    echo "  - Consider setting up custom domain and SSL certificate"
    echo "  - Set up monitoring and alerting"
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Histowalk - Azure Deployment Tool    ║${NC}"
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
    log_info "Azure Configuration:"
    echo "  - Azure Location: $AZURE_LOCATION"
    echo "  - Resource Group: $AZURE_RESOURCE_GROUP"
    echo "  - ACR Name: $ACR_NAME"
    
    # Important note about Key Vault
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                         IMPORTANT NOTE                         ║${NC}"
    echo -e "${PURPLE}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${PURPLE}║ This script requires a Key Vault at:                          ║${NC}"
    echo -e "${PURPLE}║ histowalk-kv-${ENVIRONMENT}                                    ║${NC}"
    echo -e "${PURPLE}║                                                                ║${NC}"
    echo -e "${PURPLE}║ The Key Vault must contain your API keys as secrets:          ║${NC}"
    echo -e "${PURPLE}║ - VITE_OPENAI_API_KEY                                         ║${NC}"
    echo -e "${PURPLE}║ - VITE_GEOAPIFY_API_KEY                                       ║${NC}"
    echo -e "${PURPLE}║ - VITE_MAPBOX_API_KEY                                         ║${NC}"
    echo -e "${PURPLE}║ - VITE_ELEVENLABS_API_KEY                                     ║${NC}"
    echo -e "${PURPLE}║ - VITE_ENABLE_ELEVENLABS                                      ║${NC}"
    echo -e "${PURPLE}║ - VITE_MEGATRON_VOICE_ID                                      ║${NC}"
    echo -e "${PURPLE}║ - VITE_FREEMAN_VOICE_ID                                       ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # Execute deployment pipeline
    check_prerequisites
    validate_git_tag
    get_azure_info
    validate_acr_image
    check_key_vault
    create_or_get_managed_identity
    assign_key_vault_access
    
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