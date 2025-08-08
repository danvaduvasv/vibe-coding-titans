#!/bin/bash

# Histowalk - Azure Cleanup Script
# This script removes all Azure resources created by the deploy-azure-version.sh script

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
    echo "Usage: $0 [ENVIRONMENT] [--force]"
    echo
    echo "Parameters:"
    echo "  ENVIRONMENT    Target environment to cleanup (develop, qa, prod)"
    echo "  --force        Skip confirmation prompts (dangerous!)"
    echo
    echo "Environment variables:"
    echo "  AZURE_SUBSCRIPTION_ID   Azure subscription ID"
    echo "  AZURE_RESOURCE_GROUP    Azure resource group (default: histowalk-rg)"
    echo "  AZURE_LOCATION          Azure location (default: westeurope)"
    echo "  ACR_NAME                Azure Container Registry name (default: histowalkacr)"
    echo
    echo "Examples:"
    echo "  $0                      # Interactive mode (recommended)"
    echo "  $0 develop              # Cleanup develop environment"
    echo "  $0 prod --force         # Force cleanup production (dangerous!)"
    echo
    echo "⚠️  WARNING: This script will permanently delete:"
    echo "  - Container Apps"
    echo "  - Container Apps Environments"
    echo "  - Managed Identities"
    echo "  - Key Vaults and secrets"
    echo "  - Container Registry and images"
    echo "  - Resource Group (if empty)"
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
    
    if ! command -v az >/dev/null 2>&1; then
        missing_tools+=("azure-cli")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
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

# Check if Container App exists
check_container_app_exists() {
    local app_name="$1"
    
    if az containerapp show --name "$app_name" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Container App
delete_container_app() {
    local app_name="$1"
    
    log_info "Deleting Container App: $app_name"
    
    az containerapp delete \
        --name "$app_name" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --yes
    
    log_success "Container App deleted: $app_name"
}

# Check if Container Apps Environment exists
check_container_apps_environment_exists() {
    local env_name="$1"
    
    if az containerapp env show --name "$env_name" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Container Apps Environment
delete_container_apps_environment() {
    local env_name="$1"
    
    log_info "Deleting Container Apps Environment: $env_name"
    
    az containerapp env delete \
        --name "$env_name" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --yes
    
    log_success "Container Apps Environment deleted: $env_name"
}

# Check if Managed Identity exists
check_managed_identity_exists() {
    local identity_name="$1"
    
    if az identity show --name "$identity_name" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Managed Identity
delete_managed_identity() {
    local identity_name="$1"
    
    log_info "Deleting Managed Identity: $identity_name"
    
    az identity delete \
        --name "$identity_name" \
        --resource-group "$AZURE_RESOURCE_GROUP"
    
    log_success "Managed Identity deleted: $identity_name"
}

# Check if Key Vault exists
check_key_vault_exists() {
    local vault_name="$1"
    
    if az keyvault show --name "$vault_name" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Key Vault
delete_key_vault() {
    local vault_name="$1"
    
    log_info "Deleting Key Vault: $vault_name"
    
    # Delete the Key Vault (this will also delete all secrets)
    az keyvault delete \
        --name "$vault_name" \
        --resource-group "$AZURE_RESOURCE_GROUP"
    
    log_success "Key Vault deleted: $vault_name"
}

# Check if Container Registry exists
check_acr_exists() {
    local acr_name="$1"
    
    if az acr show --name "$acr_name" --resource-group "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Container Registry and all images
delete_acr() {
    local acr_name="$1"
    
    log_info "Deleting Container Registry and all images: $acr_name"
    
    # Delete the Container Registry (this will also delete all images)
    az acr delete \
        --name "$acr_name" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --yes
    
    log_success "Container Registry deleted: $acr_name"
}

# Check if Resource Group exists
check_resource_group_exists() {
    if az group show --name "$AZURE_RESOURCE_GROUP" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Delete Resource Group (only if empty)
delete_resource_group() {
    log_info "Checking if Resource Group is empty: $AZURE_RESOURCE_GROUP"
    
    # List all resources in the resource group
    local resource_count
    resource_count=$(az resource list --resource-group "$AZURE_RESOURCE_GROUP" --query 'length(@)' --output tsv 2>/dev/null || echo "0")
    
    if [[ "$resource_count" == "0" ]]; then
        log_info "Resource Group is empty, deleting: $AZURE_RESOURCE_GROUP"
        
        az group delete \
            --name "$AZURE_RESOURCE_GROUP" \
            --yes
        
        log_success "Resource Group deleted: $AZURE_RESOURCE_GROUP"
    else
        log_info "Resource Group is not empty ($resource_count resources), skipping deletion: $AZURE_RESOURCE_GROUP"
        log_info "You may need to manually delete remaining resources or the entire resource group."
    fi
}

# Cleanup single environment
cleanup_environment() {
    local env="$1"
    local container_app_name="${APP_NAME}-${env}"
    local environment_name="histowalk-env-${env}"
    local managed_identity_name="histowalk-mi-${env}"
    local key_vault_name="histowalk-kv-${env}"
    
    log_info "Cleaning up environment: $env"
    
    # 1. Delete Container App (depends on Container Apps Environment)
    if check_container_app_exists "$container_app_name"; then
        delete_container_app "$container_app_name"
    else
        log_info "Container App not found: $container_app_name"
    fi
    
    # 2. Delete Container Apps Environment (after Container App is deleted)
    if check_container_apps_environment_exists "$environment_name"; then
        delete_container_apps_environment "$environment_name"
    else
        log_info "Container Apps Environment not found: $environment_name"
    fi
    
    # 3. Delete Managed Identity (after Container App is deleted)
    if check_managed_identity_exists "$managed_identity_name"; then
        delete_managed_identity "$managed_identity_name"
    else
        log_info "Managed Identity not found: $managed_identity_name"
    fi
    
    # 4. Delete Key Vault (after Container App is deleted)
    if check_key_vault_exists "$key_vault_name"; then
        delete_key_vault "$key_vault_name"
    else
        log_info "Key Vault not found: $key_vault_name"
    fi
    
    log_success "Environment cleanup completed: $env"
}

# Cleanup Container Registry (shared across environments)
cleanup_acr() {
    log_info "Cleaning up Container Registry: $ACR_NAME"
    
    if check_acr_exists "$ACR_NAME"; then
        delete_acr "$ACR_NAME"
    else
        log_info "Container Registry not found: $ACR_NAME"
    fi
}

# Main cleanup function
cleanup() {
    log_info "Starting cleanup process..."
    
    if [[ "$ENVIRONMENT" == "all" ]]; then
        log_info "Cleaning up all environments..."
        
        # Cleanup all environments
        for env in "${VALID_ENVIRONMENTS[@]}"; do
            cleanup_environment "$env"
        done
        
        # Cleanup shared Container Registry
        cleanup_acr
        
        # Try to delete Resource Group if empty
        if check_resource_group_exists; then
            delete_resource_group
        else
            log_info "Resource Group not found: $AZURE_RESOURCE_GROUP"
        fi
    else
        log_info "Cleaning up environment: $ENVIRONMENT"
        
        # Cleanup specific environment
        cleanup_environment "$ENVIRONMENT"
        
        # Ask if user wants to cleanup Container Registry too
        echo
        read -p "Do you want to also delete the Container Registry and all images? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup_acr
        else
            log_info "Container Registry cleanup skipped."
        fi
        
        # Ask if user wants to cleanup Resource Group if empty
        echo
        read -p "Do you want to delete the Resource Group if it's empty? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if check_resource_group_exists; then
                delete_resource_group
            else
                log_info "Resource Group not found: $AZURE_RESOURCE_GROUP"
            fi
        else
            log_info "Resource Group cleanup skipped."
        fi
    fi
    
    echo
    log_success "🎉 Cleanup completed successfully!"
    echo
    log_info "Cleanup Summary:"
    if [[ "$ENVIRONMENT" == "all" ]]; then
        echo "  - All environments cleaned up"
        echo "  - Container Registry deleted"
        echo "  - Resource Group deleted (if empty)"
    else
        echo "  - Environment: $ENVIRONMENT"
        echo "  - Container Registry: User choice"
        echo "  - Resource Group: User choice"
    fi
    echo
    log_note "💡 Next steps:"
    echo "  - Verify resources are deleted in Azure Portal"
    echo "  - Check for any remaining resources manually"
    echo "  - Consider cleaning up any associated Application Insights"
    echo "  - Check for any remaining role assignments"
}

# Main function
main() {
    echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Histowalk - Azure Cleanup Tool       ║${NC}"
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
    log_info "Azure Configuration:"
    echo "  - Azure Location: $AZURE_LOCATION"
    echo "  - Resource Group: $AZURE_RESOURCE_GROUP"
    echo "  - ACR Name: $ACR_NAME"
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
    echo -e "${RED}║ - Container Apps                                                 ║${NC}"
    echo -e "${RED}║ - Container Apps Environments                                    ║${NC}"
    echo -e "${RED}║ - Managed Identities                                             ║${NC}"
    echo -e "${RED}║ - Key Vaults and secrets                                         ║${NC}"
    if [[ "$ENVIRONMENT" != "all" ]]; then
        echo -e "${RED}║ - Container Registry and images (optional)                    ║${NC}"
        echo -e "${RED}║ - Resource Group (if empty, optional)                        ║${NC}"
    else
        echo -e "${RED}║ - Container Registry and images                               ║${NC}"
        echo -e "${RED}║ - Resource Group (if empty)                                   ║${NC}"
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