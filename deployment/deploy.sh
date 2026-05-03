#!/usr/bin/env bash
# Bump the pinned image tag and deploy.
# Usage: ./deploy.sh [backend-version] [frontend-version]
# Example: ./deploy.sh 2.0.23 2.0.23
set -euo pipefail

cd "$(dirname "$0")"

BACKEND_VERSION="${1:-}"
FRONTEND_VERSION="${2:-}"

if [ -z "$BACKEND_VERSION" ] || [ -z "$FRONTEND_VERSION" ]; then
  echo "Usage: $0 <backend-version> <frontend-version>"
  echo "Example: $0 2.0.23 2.0.23"
  exit 1
fi

sed -i "s|paulwoods/equipment-backend:.*|paulwoods/equipment-backend:${BACKEND_VERSION}|" docker-compose.yml
sed -i "s|paulwoods/equipment-frontend:.*|paulwoods/equipment-frontend:${FRONTEND_VERSION}|" docker-compose.yml

docker compose pull
docker compose up -d --remove-orphans
docker compose ps
