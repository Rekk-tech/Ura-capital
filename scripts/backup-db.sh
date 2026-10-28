#!/usr/bin/env bash
# ========================================================
# scripts/backup-db.sh - Automated Daily PostgreSQL Backup
# Aura Capital Production Disaster Recovery Plan
# ========================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/aura-capital}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/aura_db_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting automated database backup..."

# Extract credentials from .env if present
if [ -f .env ]; then
  POSTGRES_USER=$(grep -E '^POSTGRES_USER=' .env | cut -d '=' -f2- || echo "postgres")
  POSTGRES_DB=$(grep -E '^POSTGRES_DB=' .env | cut -d '=' -f2- || echo "aura_capital_prod")
else
  POSTGRES_USER="postgres"
  POSTGRES_DB="aura_capital_prod"
fi

# Execute pg_dump directly inside the postgres container and pipe to gzip
docker compose -f "${COMPOSE_FILE}" exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup successful: ${BACKUP_FILE} (${FILE_SIZE})"

# Purge backups older than retention policy (14 days)
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "aura_db_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Automated backup workflow complete."

