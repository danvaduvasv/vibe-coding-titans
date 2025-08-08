# Scripts Directory

This directory contains automation scripts for the Histowalk App project.

## 📦 package-and-publish.sh

A comprehensive release automation script that handles the complete CI/CD pipeline for publishing Histowalk to AWS ECR or Azure ACR.

### What it does:
- Creates Git tags for versioning
- Builds Docker images for multiple platforms
- Publishes to AWS ECR or Azure ACR
- Supports both cloud providers with a simple parameter switch
- Creates necessary cloud resources (repositories, registries)
- Handles authentication and cleanup

### Cloud Provider Support:
- **AWS ECR**: Default provider, creates ECR repository and pushes images
- **Azure ACR**: Creates Azure Container Registry and resource group, pushes images

### Usage:
```bash
# AWS (default)
./scripts/package-and-publish.sh v1.0.0

# Azure
CLOUD_PROVIDER=azure ./scripts/package-and-publish.sh v1.0.0

# Azure with custom settings
AZURE_LOCATION=eastus ACR_NAME=myregistry CLOUD_PROVIDER=azure ./scripts/package-and-publish.sh v1.0.0
```

## 🚀 deploy-aws-version.sh

A comprehensive deployment script that deploys specific versions to AWS App Runner environments.

### What it does:
- Deploys to AWS App Runner (serverless container platform)
- Creates necessary IAM roles and policies
- Manages AWS Secrets Manager for environment variables
- Provides health checks and monitoring
- Supports multiple environments (develop, qa, prod)

### Usage:
```bash
# Interactive mode
./scripts/deploy-aws-version.sh

# Direct deployment
./scripts/deploy-aws-version.sh develop v1.2.3
```

## 🚀 deploy-azure-version.sh

A comprehensive deployment script that deploys specific versions to Azure Container Apps environments.

### What it does:
- Deploys to Azure Container Apps (serverless container platform)
- Creates necessary managed identities and role assignments
- Manages Azure Key Vault for secrets and environment variables
- Provides health checks and monitoring
- Supports multiple environments (develop, qa, prod)
- Auto-scales based on demand

### Azure Resources Created:
- **Resource Group**: histowalk-rg (or custom name)
- **Container Apps Environment**: histowalk-env-{environment}
- **Container App**: histowalk-{environment}
- **Key Vault**: histowalk-kv-{environment}
- **Managed Identity**: histowalk-mi-{environment}
- **Container Registry**: histowalkacr (from package script)

### Usage:
```bash
# Interactive mode
./scripts/deploy-azure-version.sh

# Direct deployment
./scripts/deploy-azure-version.sh develop v1.2.3

# With custom settings
AZURE_LOCATION=eastus AZURE_RESOURCE_GROUP=my-rg ./scripts/deploy-azure-version.sh prod v2.0.0
```

## 🧹 cleanup-aws.sh

A comprehensive cleanup script that removes all AWS resources created by the deploy-aws-version.sh script.

### What it does:
- Removes App Runner services
- Deletes IAM roles and policies
- Cleans up Secrets Manager secrets
- Removes ECR repository and all images
- Handles dependencies in correct order
- Supports single environment or all environments

### Resources Deleted (in order):
1. **App Runner Services** (depends on IAM roles)
2. **IAM Roles** (Access and Instance roles)
3. **Secrets Manager Secrets**
4. **ECR Repository and Images** (optional)
5. **CloudWatch Logs** (manual cleanup recommended)

### Usage:
```bash
# Interactive mode (recommended)
./scripts/cleanup-aws.sh

# Cleanup specific environment
./scripts/cleanup-aws.sh develop

# Force cleanup (skip prompts)
./scripts/cleanup-aws.sh prod --force

# Cleanup all environments
./scripts/cleanup-aws.sh all
```

## 🧹 cleanup-azure.sh

A comprehensive cleanup script that removes all Azure resources created by the deploy-azure-version.sh script.

### What it does:
- Removes Container Apps
- Deletes Container Apps Environments
- Cleans up Managed Identities
- Removes Key Vaults and secrets
- Deletes Container Registry and all images
- Removes Resource Group (if empty)
- Handles dependencies in correct order

### Resources Deleted (in order):
1. **Container Apps** (depends on Container Apps Environment)
2. **Container Apps Environments**
3. **Managed Identities**
4. **Key Vaults and Secrets**
5. **Container Registry and Images** (optional)
6. **Resource Group** (if empty, optional)

### Usage:
```bash
# Interactive mode (recommended)
./scripts/cleanup-azure.sh

# Cleanup specific environment
./scripts/cleanup-azure.sh develop

# Force cleanup (skip prompts)
./scripts/cleanup-azure.sh prod --force

# Cleanup all environments
./scripts/cleanup-azure.sh all
```

### Prerequisites for Azure:
1. **Install Azure CLI**:
   ```bash
   # macOS
   brew install azure-cli
   
   # Ubuntu/Debian
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Authenticate and Setup**:
   ```bash
   az login
   az account set --subscription <subscription-id>
   az extension add --name containerapp
   az extension add --name acr
   ```

3. **Create Key Vault and Secrets**:
   ```bash
   az keyvault create --name histowalk-kv-develop --resource-group histowalk-rg --location westeurope
   az keyvault secret set --vault-name histowalk-kv-develop --name VITE_OPENAI_API_KEY --value "your-key"
   # ... add other secrets
   ```

### Azure vs AWS Comparison:
| Feature | AWS App Runner | Azure Container Apps |
|---------|----------------|---------------------|
| **Platform** | Serverless containers | Serverless containers |
| **Scaling** | Auto-scaling | Auto-scaling |
| **Secrets** | Secrets Manager | Key Vault |
| **Identity** | IAM Roles | Managed Identity |
| **Networking** | VPC (optional) | VNet integration |
| **Monitoring** | CloudWatch | Application Insights |
| **Cost** | Pay per request | Pay per request |

## 🔧 Common Workflows

### Complete AWS Deployment:
```bash
# 1. Package and publish
./scripts/package-and-publish.sh v1.0.0

# 2. Deploy to AWS
./scripts/deploy-aws-version.sh develop v1.0.0

# 3. Cleanup when done
./scripts/cleanup-aws.sh develop
```

### Complete Azure Deployment:
```bash
# 1. Package and publish to Azure
CLOUD_PROVIDER=azure ./scripts/package-and-publish.sh v1.0.0

# 2. Deploy to Azure
./scripts/deploy-azure-version.sh develop v1.0.0

# 3. Cleanup when done
./scripts/cleanup-azure.sh develop
```

### Multi-Cloud Deployment:
```bash
# Deploy to both clouds
./scripts/package-and-publish.sh v1.0.0
CLOUD_PROVIDER=azure ./scripts/package-and-publish.sh v1.0.0

./scripts/deploy-aws-version.sh prod v1.0.0
./scripts/deploy-azure-version.sh prod v1.0.0

# Cleanup both clouds
./scripts/cleanup-aws.sh all
./scripts/cleanup-azure.sh all
```

## 📋 Prerequisites

### For AWS:
- AWS CLI installed and configured
- Appropriate IAM permissions
- Docker installed

### For Azure:
- Azure CLI installed and authenticated
- Container Apps and ACR extensions
- Docker installed
- Contributor or Owner role on subscription/resource group

## 🔐 Security Notes

- Both scripts create necessary security resources (IAM roles, managed identities)
- Secrets are stored securely (AWS Secrets Manager, Azure Key Vault)
- Network access is properly configured
- Health checks ensure application availability
- Cleanup scripts handle dependencies correctly

## 🚨 Troubleshooting

### Common Issues:
1. **Authentication**: Ensure proper cloud provider authentication
2. **Permissions**: Check role assignments and permissions
3. **Resources**: Verify required resources exist (registries, vaults)
4. **Extensions**: Install required Azure CLI extensions
5. **Secrets**: Ensure all required secrets are configured

### Debug Commands:
```bash
# AWS
aws sts get-caller-identity
aws ecr describe-repositories
aws apprunner list-services

# Azure
az account show
az containerapp list --resource-group histowalk-rg
az keyvault list --resource-group histowalk-rg
```

### Cleanup Safety Features:
- **Confirmation prompts** for all destructive operations
- **Double confirmation** for production environments
- **Force flag** for automated scripts (use with caution)
- **Dependency checking** to prevent errors
- **Resource existence validation** before deletion
- **Graceful error handling** for missing resources

## ⚠️ Cleanup Warnings

### Important Safety Notes:
- **Permanent deletion**: All cleanup operations are irreversible
- **Production environments**: Require double confirmation
- **Shared resources**: ECR/ACR deletion affects all environments
- **Data loss**: All application data will be permanently deleted
- **Cost implications**: Deleting resources stops billing immediately

### Best Practices:
1. **Test cleanup** on development environments first
2. **Backup important data** before cleanup
3. **Verify resources** in cloud console after cleanup
4. **Check billing** to ensure resources are deleted
5. **Document customizations** that might not be recreated 