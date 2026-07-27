#!/bin/bash
# Create the application's database role and database (idempotent).
#
# Runs automatically on a FRESH postgres volume via /docker-entrypoint-initdb.d.
# For an EXISTING volume, run it manually inside the container:
#   docker compose exec postgres bash /docker-entrypoint-initdb.d/init-app-db.sh
#
# Reads from the environment (provided by .env via docker compose):
#   SPRING_DATASOURCE_USERNAME  role to create; also used as the database name
#   SPRING_DATASOURCE_PASSWORD  role password
set -euo pipefail

APP_USER="${SPRING_DATASOURCE_USERNAME:?SPRING_DATASOURCE_USERNAME is not set}"
APP_PASSWORD="${SPRING_DATASOURCE_PASSWORD:?SPRING_DATASOURCE_PASSWORD is not set}"
APP_DB="$APP_USER"

psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER:-postgres}" -d postgres <<EOSQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_USER}') THEN
        CREATE ROLE "${APP_USER}" LOGIN PASSWORD '${APP_PASSWORD}';
    ELSE
        ALTER ROLE "${APP_USER}" LOGIN PASSWORD '${APP_PASSWORD}';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE "${APP_DB}" OWNER "${APP_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${APP_DB}')\gexec
EOSQL

echo "Role '${APP_USER}' and database '${APP_DB}' are ready."
