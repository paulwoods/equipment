#!/usr/bin/env bash
# Backup the Postgres database
# Keeps 30 days worth of backups
#
# Install with: crontab -e
# Backup at 1am daily
# 0 1 * * * ~/equipment/backup.sh
#
set -euo pipefail

BACKUP_DIR="$HOME/equipment/sql"
mkdir -p "$BACKUP_DIR"

TS=$(date -Iseconds)
TMP="$BACKUP_DIR/.${TS}.sql.gz.tmp"

docker compose -f "$HOME/equipment/deployment/docker-compose.yml" exec -T postgres \
  pg_dumpall -U "${POSTGRES_USER:-postgres}" | gzip > "$TMP"

mv "$TMP" "$BACKUP_DIR/${TS}.sql.gz"
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +30 -delete
