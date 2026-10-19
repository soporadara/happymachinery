#!/usr/bin/env bash
# ==============================================================================
# Happy Machinery - Safe Hostinger Deployment Script
# ==============================================================================
# This script safely deploys code updates to Hostinger while strictly preserving
# production databases, user-generated storage, and server configurations.
# ==============================================================================

set -euo pipefail

SSH_HOST="happymachinery-prod"
REMOTE_PATH="/home/u534600013/domains/happymachinery.com"
REMOTE_PUBLIC="${REMOTE_PATH}/public_html"
BACKUP_DIR="/home/u534600013/happymachinery-backups"

echo "=================================================="
echo " Happy Machinery - Pre-Deployment Checks"
echo "=================================================="

# 1. Local Build & Type Check
echo "[1/6] Running local build and TypeScript verification..."
npm run build

# 2. Check SSH Connection
echo "[2/6] Verifying SSH connectivity to Hostinger..."
ssh -o BatchMode=yes "${SSH_HOST}" 'echo "SSH connection verified."'

# 3. Create Fresh Remote Pre-Deployment Backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "[3/6] Creating pre-deployment backup on Hostinger (${TIMESTAMP})..."
ssh "${SSH_HOST}" "
  set -e
  mkdir -p -m 700 '${BACKUP_DIR}'
  tar -czf '${BACKUP_DIR}/pre_deploy_backup_${TIMESTAMP}.tar.gz' -C '${REMOTE_PATH}' happy-machinery-storage public_html
  sha256sum '${BACKUP_DIR}/pre_deploy_backup_${TIMESTAMP}.tar.gz' > '${BACKUP_DIR}/pre_deploy_backup_${TIMESTAMP}.tar.gz.sha256'
  echo 'Backup created: ${BACKUP_DIR}/pre_deploy_backup_${TIMESTAMP}.tar.gz'
"

# 4. Dry Run - Show Exact Changes
echo "[4/6] Performing rsync dry-run (previewing changes)..."
rsync -avzn --delete \
  --exclude="happy-machinery-storage" \
  --exclude="content.json" \
  --exclude="content.lock" \
  --exclude="*.log" \
  --exclude=".user.ini" \
  dist/ "${SSH_HOST}:${REMOTE_PUBLIC}/"

echo ""
read -p "Do you want to proceed with deploying these changes to production? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Deployment aborted by user. No files were changed on production."
  exit 0
fi

# 5. Live Deployment
echo "[5/6] Deploying files to production public_html..."
rsync -avz \
  --exclude="happy-machinery-storage" \
  --exclude="content.json" \
  --exclude="content.lock" \
  --exclude="*.log" \
  --exclude=".user.ini" \
  dist/ "${SSH_HOST}:${REMOTE_PUBLIC}/"

# Also sync backend PHP endpoints and crawler handlers from public/
rsync -avz \
  public/api/content.php \
  public/share_preview.php \
  public/share_image.php \
  public/.htaccess \
  "${SSH_HOST}:${REMOTE_PUBLIC}/"

# 6. Post-Deployment Smoke Tests
echo "[6/6] Running post-deployment health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://happymachinery.com/)
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://happymachinery.com/api/content.php?key=products")

echo "Homepage status: ${HTTP_STATUS}"
echo "API endpoint status: ${API_STATUS}"

if [[ "${HTTP_STATUS}" == "200" && "${API_STATUS}" == "200" ]]; then
  echo "=================================================="
  echo " Deployment Successful! Live site is operational."
  echo "=================================================="
else
  echo "WARNING: Health check returned non-200 status code!"
  echo "Review site immediately or run ./rollback.sh ${TIMESTAMP}"
fi
