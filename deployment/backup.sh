#!/usr/bin/env bash
# Backup the Postgres database
# Keeps 30 most recent backups
#
# Install with: crontab -e
# Backup at 1am daily
# 0 1 * * * /home/mrpaulwoods/IdeaProjects/equipment/deployment/backup.sh >> /home/mrpaulwoods/caddy/backup.log 2>&1
#
set -euo pipefail

# The equipment services (backend, frontend, postgres) are run by the compose
# file in ~/caddy, alongside other apps.
DEPLOY_DIR="$HOME/caddy"
BACKUP_DIR="$DEPLOY_DIR/pg-backups"
mkdir -p "$BACKUP_DIR"

if [ -f "$DEPLOY_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$DEPLOY_DIR/.env"
  set +a
fi

TS=$(date -u +%Y%m%dT%H%M%SZ)
TMP="$BACKUP_DIR/.${TS}.sql.gz.tmp"

docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec -T postgres \
  pg_dumpall -U "${POSTGRES_USER:-postgres}" | gzip > "$TMP"

mv "$TMP" "$BACKUP_DIR/${TS}.sql.gz"

# shellcheck disable=SC2012  # filenames are generated timestamps, no special chars
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
