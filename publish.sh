#!/usr/bin/env bash

source .env

set -euo pipefail

VERSION=${1:-$(git describe --tags --abbrev=0)}

if [[ -z "$VERSION" ]]; then
  echo "Error: no version specified and no git tags found"
  exit 1
fi

echo "Publishing version: $VERSION"

docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"

# Backend
docker build \
  --platform linux/amd64 \
  -t "paulwoods/equipment-backend:${VERSION}" \
  -t "paulwoods/equipment-backend:latest" \
  ./backend
docker push "paulwoods/equipment-backend:${VERSION}"
docker push "paulwoods/equipment-backend:latest"

# Frontend (Nginx + React)
docker build \
  --platform linux/amd64 \
  -t "paulwoods/equipment-frontend:${VERSION}" \
  -t "paulwoods/equipment-frontend:latest" \
  ./nginx
docker push "paulwoods/equipment-frontend:${VERSION}"
docker push "paulwoods/equipment-frontend:latest"

docker logout

echo "Done. Published $VERSION"
