#!/usr/bin/env bash
# ==============================================================================
# Happy Machinery - Production Rollback Script
# ==============================================================================
# Restores public_html and optionally database storage from a verified backup.
# ==============================================================================

set -euo pipefail

SSH_HOST="happymachinery-prod"
REMOTE_PATH="/home/u534600013/domains/happymachinery.com"
BACKUP_DIR="/home/u534600013/happymachinery-backups"

echo "=================================================="
echo " Happy Machinery - Production Rollback"
echo "=================================================="

# Check available backups
echo "Fetching available backups on Hostinger..."
ssh "${SSH_HOST}" "ls -lht '${BACKUP_DIR}'/*.tar.gz | head -n 10"

echo ""
BACKUP_NAME="${1:-}"
if [[ -z "${BACKUP_NAME}" ]]; then
  read -p "Enter the backup file name to restore (e.g. pre_deploy_backup_YYYYMMDD_HHMMSS.tar.gz): " BACKUP_NAME
fi

if [[ -z "${BACKUP_NAME}" ]]; then
  echo "No backup specified. Rollback aborted."
  exit 1
fi

echo ""
read -p "Restore CODE ONLY (public_html) or BOTH code and database? (code/both): " RESTORE_MODE
if [[ "${RESTORE_MODE}" != "code" && "${RESTORE_MODE}" != "both" ]]; then
  echo "Invalid option. Rollback aborted."
  exit 1
fi

echo ""
read -p "Are you sure you want to rollback production using ${BACKUP_NAME}? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Rollback cancelled."
  exit 0
fi

echo "Executing rollback on production..."
if [[ "${RESTORE_MODE}" == "code" ]]; then
  ssh "${SSH_HOST}" "
    set -e
    tar -xzf '${BACKUP_DIR}/${BACKUP_NAME}' -C '${REMOTE_PATH}' public_html
    echo 'public_html successfully restored.'
  "
else
  ssh "${SSH_HOST}" "
    set -e
    tar -xzf '${BACKUP_DIR}/${BACKUP_NAME}' -C '${REMOTE_PATH}' public_html happy-machinery-storage
    echo 'public_html and happy-machinery-storage successfully restored.'
  "
fi

echo "Running post-rollback health check..."
curl -I https://happymachinery.com/
echo "Rollback completed."
