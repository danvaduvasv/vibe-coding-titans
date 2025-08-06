# Scripts Directory

This directory contains automation scripts for the Histowalk App project.

## 📦 package-and-publish.sh

A comprehensive release automation script that handles the complete CI/CD pipeline for publishing Histowalk to AWS ECR.

### What it does:

1. **🏷️ Git Tagging**: Creates and pushes a new Git tag with semantic versioning
2. **🐳 Docker Build**: Builds a production Docker image with the version tag (x86_64/amd64 platform for cloud compatibility)
3. **☁️ ECR Management**: Creates AWS ECR repository if it doesn't exist
4. **🚀 Image Publishing**: Pushes the Docker image to AWS ECR

### Prerequisites:

- **Git**: For version tagging and repository management
- **Docker**: For building and tagging images
- **AWS CLI**: For ECR operations (must be configured with credentials)
- **AWS Permissions**: ECR repository creation, read/write access

### AWS CLI Setup:

```bash
# Configure AWS CLI (choose one method)

# Method 1: Interactive configuration
aws configure

# Method 2: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Method 3: AWS Profile
aws configure --profile myprofile
export AWS_PROFILE=myprofile

# Verify configuration
aws sts get-caller-identity
```

### Usage:

#### Interactive Mode (Recommended)
```bash
./scripts/package-and-publish.sh
```

The script will:
- Check prerequisites
- Show current configuration
- Display the latest Git tag
- Offer version increment options (patch, minor, major, custom)
- Ask for confirmation before proceeding

#### Specify Version Directly
```bash
./scripts/package-and-publish.sh v1.2.3
```

#### Using Environment Variables
```bash
# Use different AWS region
AWS_REGION=eu-west-1 ./scripts/package-and-publish.sh

# Use different ECR repository name
ECR_REPOSITORY_NAME=my-chronoguide ./scripts/package-and-publish.sh

# Use custom image name
IMAGE_NAME=custom-chronoguide ./scripts/package-and-publish.sh

# Use different Dockerfile
DOCKERFILE_PATH=./docker/Dockerfile.prod ./scripts/package-and-publish.sh
```

### Configuration Options:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region for ECR repository |
| `ECR_REPOSITORY_NAME` | `chronoguide` | Name of the ECR repository |
| `IMAGE_NAME` | `chronoguide` | Local Docker image name |
| `DOCKERFILE_PATH` | `./Dockerfile` | Path to the Dockerfile |

### Version Format:

The script uses semantic versioning (SemVer) format: `vMAJOR.MINOR.PATCH`

- **Patch** (`v1.0.1`): Bug fixes, no new features
- **Minor** (`v1.1.0`): New features, backward compatible
- **Major** (`v2.0.0`): Breaking changes

### Example Workflow:

```bash
# 1. Make sure your changes are committed
git add .
git commit -m "Add new feature"
git push

# 2. Run the release script
./scripts/package-and-publish.sh

# Output:
# ╔══════════════════════════════════════════════╗
# ║           Histowalk - Release Tool         ║
# ╚══════════════════════════════════════════════╝
#
# [INFO] Starting release process...
# [INFO] Configuration:
#   - AWS Region: us-east-1
#   - ECR Repository: chronoguide
#   - Image Name: chronoguide
#   - Dockerfile: ./Dockerfile
#
# [INFO] Checking prerequisites...
# [SUCCESS] All prerequisites met!
# [INFO] Latest tag: v1.0.0
#
# Select version increment:
# 1) Patch: v1.0.1 (bug fixes)
# 2) Minor: v1.1.0 (new features)
# 3) Major: v2.0.0 (breaking changes)
# 4) Custom version
# Enter choice (1-4): 2
#
# [INFO] Selected version: v1.1.0
#
# [WARNING] This will:
#   1. Create and push Git tag: v1.1.0
#   2. Build Docker image: chronoguide:v1.1.0
#   3. Create ECR repository if needed: chronoguide
#   4. Push image to ECR in region: us-east-1
#
# Continue? (y/N): y
#
# [INFO] Creating Git tag: v1.1.0
# [SUCCESS] Git tag v1.1.0 created and pushed!
# [INFO] Building Docker image: chronoguide:v1.1.0
# [SUCCESS] Docker image built successfully!
# [INFO] AWS Account ID: 123456789012
# [INFO] ECR Registry: 123456789012.dkr.ecr.us-east-1.amazonaws.com
# [SUCCESS] ECR repository 'chronoguide' already exists.
# [INFO] Logging in to ECR...
# [SUCCESS] Successfully logged in to ECR!
# [INFO] Tagging image for ECR...
# [INFO] Pushing image to ECR: 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoguide:v1.1.0
# [INFO] Pushing latest tag to ECR: 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoguide:latest
# [SUCCESS] Image pushed successfully to ECR!
#
# [INFO] Image URIs:
#   - 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoguide:v1.1.0
#   - 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoguide:latest
#
# Remove local Docker images? (y/N): y
# [INFO] Cleaning up local images...
# [SUCCESS] Local images cleaned up!
#
# [SUCCESS] 🎉 Release v1.1.0 completed successfully!
#
# [INFO] Next steps:
#   - Update your deployment configurations to use: 123456789012.dkr.ecr.us-east-1.amazonaws.com/chronoguide:v1.1.0
#   - Consider creating a GitHub release for tag: v1.1.0
#   - Update your production environment
```

### Troubleshooting:

#### AWS Credentials Issues
```bash
# Check if AWS CLI is configured
aws sts get-caller-identity

# If not configured, run:
aws configure
```

#### Docker Not Running
```bash
# Start Docker Desktop or Docker daemon
sudo systemctl start docker  # Linux
# or restart Docker Desktop on macOS/Windows
```

#### Permission Denied
```bash
# Make script executable
chmod +x scripts/package-and-publish.sh

# Check if you have ECR permissions
aws ecr describe-repositories --region us-east-1
```

#### Git Tag Already Exists
```bash
# List existing tags
git tag -l

# Delete a tag if needed (be careful!)
git tag -d v1.0.0
git push origin --delete v1.0.0
```

### Features:

- ✅ **Interactive version selection** with semantic versioning
- ✅ **Comprehensive prerequisite checking**
- ✅ **AWS credential validation**
- ✅ **ECR repository auto-creation** with security settings
- ✅ **Image lifecycle management** (keeps last 10 images)
- ✅ **Platform compatibility** (builds x86_64/amd64 images for cloud deployment)
- ✅ **Colorized output** for better readability
- ✅ **Error handling** with meaningful messages
- ✅ **Rollback safety** (checks for existing tags)
- ✅ **Cleanup options** for local images
- ✅ **Help documentation** (`--help` flag)

### Security Features:

- 🔒 **Image scanning** enabled on ECR repository
- 🔒 **AES256 encryption** for stored images
- 🔒 **No credentials stored** in scripts or images
- 🔒 **IAM-based authentication** through AWS CLI

## 🚀 deploy-version.sh

A comprehensive deployment script that deploys specific versions of Histowalk to AWS App Runner environments.

### What it does:

1. **🔍 Version Validation**: Validates that the specified version exists in both Git tags and ECR
2. **🏢 Environment Management**: Supports develop, qa, and prod environments
3. **🔐 Secrets Integration**: Uses AWS Secrets Manager for secure environment variable storage
4. **☁️ App Runner Deployment**: Creates or updates AWS App Runner services
5. **🏥 Health Monitoring**: Tests deployment health and provides service URLs

### Prerequisites:

- **AWS CLI**: Configured with appropriate permissions
- **App Runner Permissions**: Service creation, update, and describe permissions
- **ECR Permissions**: Read access to ECR repositories
- **Secrets Manager Permissions**: Read access to secrets
- **Git Repository**: Must be run from a Git repository

### Required AWS Permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apprunner:CreateService",
                "apprunner:UpdateService",
                "apprunner:DescribeService",
                "apprunner:TagResource"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:DescribeRepositories",
                "ecr:DescribeImages"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:DescribeSecret",
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:*:*:secret:/secrets/*-chronoguide*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:AttachRolePolicy",
                "iam:PassRole"
            ],
            "Resource": "*"
        }
    ]
}
```

### Secret Setup (IMPORTANT):

Before deploying, you MUST create a secret in AWS Secrets Manager for each environment:

#### Secret Names:
- Development: `/secrets/develop-chronoguide`
- QA: `/secrets/qa-chronoguide`
- Production: `/secrets/prod-chronoguide`

#### Create Secret via AWS CLI:
```bash
# For development environment
aws secretsmanager create-secret \
  --name "/secrets/develop-chronoguide" \
  --description "Environment variables for Histowalk develop environment" \
  --secret-string '{
    "VITE_OPENAI_API_KEY": "your-openai-api-key",
    "VITE_GEOAPIFY_API_KEY": "your-geoapify-api-key",
    "VITE_MAPBOX_API_KEY": "your-mapbox-api-key",
    "VITE_OPENAI_API_URL": "https://api.openai.com/v1/chat/completions",
    "VITE_GEOAPIFY_API_URL": "https://api.geoapify.com/v1"
  }' \
  --region eu-west-1

# For QA environment
aws secretsmanager create-secret \
  --name "/secrets/qa-chronoguide" \
  --description "Environment variables for Histowalk qa environment" \
  --secret-string '{
    "VITE_OPENAI_API_KEY": "your-qa-openai-api-key",
    "VITE_GEOAPIFY_API_KEY": "your-qa-geoapify-api-key",
    "VITE_MAPBOX_API_KEY": "your-qa-mapbox-api-key",
    "VITE_OPENAI_API_URL": "https://api.openai.com/v1/chat/completions",
    "VITE_GEOAPIFY_API_URL": "https://api.geoapify.com/v1"
  }' \
  --region eu-west-1

# For production environment
aws secretsmanager create-secret \
  --name "/secrets/prod-chronoguide" \
  --description "Environment variables for Histowalk prod environment" \
  --secret-string '{
    "VITE_OPENAI_API_KEY": "your-prod-openai-api-key",
    "VITE_GEOAPIFY_API_KEY": "your-prod-geoapify-api-key",
    "VITE_MAPBOX_API_KEY": "your-prod-mapbox-api-key",
    "VITE_OPENAI_API_URL": "https://api.openai.com/v1/chat/completions",
    "VITE_GEOAPIFY_API_URL": "https://api.geoapify.com/v1"
  }' \
  --region eu-west-1
```

#### Update Existing Secret:
```bash
aws secretsmanager update-secret \
  --secret-id "/secrets/develop-chronoguide" \
  --secret-string '{
    "VITE_OPENAI_API_KEY": "updated-openai-key",
    "VITE_GEOAPIFY_API_KEY": "updated-geoapify-key",
    "VITE_MAPBOX_API_KEY": "updated-mapbox-key"
  }' \
  --region eu-west-1
```

### Usage:

#### Interactive Mode (Recommended):
```bash
./scripts/deploy-version.sh
```

The script will prompt you to:
1. Select target environment (develop, qa, prod)
2. Choose version to deploy (with latest tag as default)

#### Semi-Interactive Mode:
```bash
# Specify environment, choose version interactively
./scripts/deploy-version.sh develop

# Specify both environment and version
./scripts/deploy-version.sh develop v1.2.3
```

#### Examples:
```bash
# Full interactive mode
./scripts/deploy-version.sh

# Interactive version selection for develop environment
./scripts/deploy-version.sh develop

# Direct deployment (no prompts)
./scripts/deploy-version.sh develop v1.2.3
./scripts/deploy-version.sh qa v2.0.0
./scripts/deploy-version.sh prod v1.5.2

# Get help
./scripts/deploy-version.sh --help
```

#### With Environment Variables:
```bash
# Use different AWS region
AWS_REGION=us-east-1 ./scripts/deploy-version.sh develop v1.2.3

# Use different ECR repository
ECR_REPOSITORY_NAME=my-chronoguide ./scripts/deploy-version.sh qa v1.2.3
```

### Configuration Options:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `AWS_REGION` | `eu-west-1` | AWS region for all services |
| `ECR_REPOSITORY_NAME` | `chronoguide` | ECR repository name |

### App Runner Configuration:

The script creates App Runner services with the following configuration:
- **CPU**: 0.25 vCPU
- **Memory**: 0.5 GB
- **Port**: 8080
- **Health Check**: HTTP on `/health` endpoint
- **Auto-scaling**: Enabled
- **Environment Variables**: From Secrets Manager

### Service Naming Convention:

App Runner services are named using the pattern: `chronoguide-<ENVIRONMENT>`

Examples:
- Development: `chronoguide-develop`
- QA: `chronoguide-qa`
- Production: `chronoguide-prod`

### Validation Process:

The script performs comprehensive validation before deployment:

1. **Parameter Validation**: Checks environment and version format
2. **Tool Validation**: Ensures Git and AWS CLI are available
3. **Credentials Validation**: Verifies AWS credentials
4. **Git Tag Validation**: Confirms version tag exists in Git
5. **ECR Image Validation**: Verifies image exists in ECR
6. **Secrets Validation**: Checks Secrets Manager secret exists

### Deployment Workflow Example:

```bash
# 1. First, ensure you have published the version
./scripts/package-and-publish.sh v1.2.3

# 2. Create secrets (one-time setup per environment)
aws secretsmanager create-secret \
  --name "/secrets/develop-chronoguide" \
  --secret-string '{"VITE_OPENAI_API_KEY":"sk-...","VITE_GEOAPIFY_API_KEY":"..."}' \
  --region eu-west-1

# 3. Deploy to development (interactive mode)
./scripts/deploy-version.sh

# Output:
# ╔══════════════════════════════════════════════╗
# ║        Histowalk - Deployment Tool         ║
# ╚══════════════════════════════════════════════╝
#
# [INFO] Select target environment:
# 1) develop  - Development environment
# 2) qa       - Quality Assurance environment
# 3) prod     - Production environment
#
# Enter choice (1-3): 1
# [INFO] Selected environment: develop
#
# [INFO] Fetching available versions...
#
# [INFO] Recent available versions:
#   v1.2.3 v1.2.2 v1.2.1 v1.2.0 v1.1.0 v1.0.0
#
# [INFO] Latest version: v1.2.3
#
# Enter version to deploy (default: v1.2.3): 
# [INFO] Selected version: v1.2.3
#
# [INFO] Deployment Configuration:
#   - Environment: develop
#   - Version: v1.2.3
# 
# ╔════════════════════════════════════════════════════════════════╗
# ║                         IMPORTANT NOTE                         ║
# ╠════════════════════════════════════════════════════════════════╣
# ║ This script requires a secret in AWS Secrets Manager at:      ║
# ║ /secrets/develop-chronoguide                                   ║
# ║                                                                ║
# ║ The secret must contain your API keys as JSON:                ║
# ║ {                                                              ║
# ║   "VITE_OPENAI_API_KEY": "your-openai-key",                   ║
# ║   "VITE_GEOAPIFY_API_KEY": "your-geoapify-key",               ║
# ║   "VITE_OPENAI_API_URL": "https://api.openai.com/v1/..."       ║
# ║   "VITE_GEOAPIFY_API_URL": "https://api.geoapify.com/v1/..."   ║
# ║ }                                                              ║
# ╚════════════════════════════════════════════════════════════════╝
#
# [SUCCESS] All prerequisites met!
# [SUCCESS] Git tag 'v1.2.3' exists.
# [SUCCESS] ECR image 'v1.2.3' exists and is ready for deployment.
# [SUCCESS] Secret '/secrets/develop-chronoguide' exists and is accessible.
# [INFO] App Runner service name: chronoguide-develop
#
# Ready to deploy v1.2.3 to develop environment.
# Continue? (y/N): y
#
# [INFO] Starting deployment of v1.2.3 to develop environment...
# [SUCCESS] App Runner configuration created
# [INFO] Service 'chronoguide-develop' does not exist. Will create it.
# [INFO] Creating new App Runner service: chronoguide-develop
# [SUCCESS] App Runner service created: arn:aws:apprunner:eu-west-1:123456789:service/chronoguide-develop
# [INFO] Waiting for service to be ready (this may take several minutes)...
# ..........
# [SUCCESS] Service is running!
# [INFO] Service URL: https://abc123.eu-west-1.awsapprunner.com
# [INFO] Testing deployment health check...
# [SUCCESS] Health check passed! ✅
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T12:00:00.000Z",
#   "uptime": 45.123,
#   "version": "1.0.0"
# }
#
# [SUCCESS] 🎉 Deployment completed successfully!
#
# [INFO] Deployment Summary:
#   - Environment: develop
#   - Version: v1.2.3
#   - Service: chronoguide-develop
#   - Image: 123456789.dkr.ecr.eu-west-1.amazonaws.com/chronoguide:v1.2.3
#   - URL: https://abc123.eu-west-1.awsapprunner.com
#   - Health Check: https://abc123.eu-west-1.awsapprunner.com/health
#
# [NOTE] 💡 Next steps:
#   - Test your application at: https://abc123.eu-west-1.awsapprunner.com
#   - Monitor service status in AWS Console
#   - Check logs if there are any issues
#   - Consider setting up custom domain and SSL certificate
```

### Required AWS IAM Permissions:

The deployment script requires the following AWS IAM permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apprunner:CreateService",
                "apprunner:UpdateService",
                "apprunner:DescribeService",
                "apprunner:ListServices",
                "apprunner:TagResource"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:DescribeRepositories",
                "ecr:DescribeImages"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:*:*:secret:/secrets/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:GetRole",
                "iam:PutRolePolicy",
                "iam:AttachRolePolicy",
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::*:role/AppRunnerInstanceRole-chronoguide-*",
                "arn:aws:iam::*:role/AppRunnerAccessRole-chronoguide-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```

**Note**: The script automatically creates two types of environment-specific IAM roles:
- **Access Role** (e.g., `AppRunnerAccessRole-chronoguide-develop`) - For App Runner to access ECR registry
- **Instance Role** (e.g., `AppRunnerInstanceRole-chronoguide-develop`) - For App Runner instances to access Secrets Manager

These roles are required for private ECR access and runtime environment secrets, providing security isolation between environments.

### Troubleshooting:

#### Version Not Found in Git
```bash
# Check available tags
git tag -l

# Fetch latest tags
git fetch --tags

# Create missing tag (if needed)
git tag v1.2.3
git push origin v1.2.3
```

#### Version Not Found in ECR
```bash
# Check available images
aws ecr describe-images --repository-name chronoguide --region eu-west-1

# Build and push missing version
./scripts/package-and-publish.sh v1.2.3
```

#### Secret Not Found
```bash
# List existing secrets
aws secretsmanager list-secrets --region eu-west-1

# Create missing secret
aws secretsmanager create-secret \
  --name "/secrets/develop-chronoguide" \
  --secret-string '{"VITE_OPENAI_API_KEY":"your-key"}' \
  --region eu-west-1
```

#### App Runner Service Issues
```bash
# Check service status
aws apprunner describe-service \
  --service-arn "arn:aws:apprunner:eu-west-1:ACCOUNT:service/chronoguide-develop" \
  --region eu-west-1

# View service logs in AWS Console
# Go to: App Runner > Services > chronoguide-develop > Logs
```

#### Permission Denied
```bash
# Check AWS credentials
aws sts get-caller-identity

# Test specific permissions
aws apprunner list-services --region eu-west-1
aws ecr describe-repositories --region eu-west-1
aws secretsmanager list-secrets --region eu-west-1
```

### Features:

- ✅ **Multi-environment support** (develop, qa, prod)
- ✅ **Version validation** against Git tags and ECR images
- ✅ **Secrets Manager integration** for secure API key storage
- ✅ **Service creation and updates** with zero-downtime deployments
- ✅ **Health check validation** with automatic testing
- ✅ **Comprehensive error handling** with helpful error messages
- ✅ **Progress monitoring** with real-time status updates
- ✅ **Service tagging** for resource management
- ✅ **Cleanup on exit** with temporary file removal

### Security Features:

- 🔒 **Encrypted secrets** in AWS Secrets Manager
- 🔒 **IAM-based authentication** with least bbx access
- 🔒 **No hardcoded credentials** in scripts or containers
- 🔒 **Environment separation** with isolated services and secrets
- 🔒 **SSL/TLS encryption** provided by App Runner

## Future Scripts

Additional automation scripts can be added to this directory:

- `rollback.sh` - Rollback to previous version
- `cleanup.sh` - Clean up old images and resources
- `test.sh` - Run integration tests against deployed image
- `monitor.sh` - Monitor service health and metrics 