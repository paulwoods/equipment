# 10. Docker Compose for single-host deployment

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The application targets self-hosted, single-VM deployments. The team is one
developer; introducing Kubernetes, Nomad, or even Swarm would dwarf the
operational surface of the application itself.

## Decision

Two Compose files serve different purposes:

- **Repo-root `docker-compose.yml`** — local development. Just Postgres,
  with the backend and frontend run from their respective tooling
  (`./mvnw spring-boot:run`, `npm run dev`).
- **`deployment/docker-compose.yml`** — production stack: `postgres:18`,
  `paulwoods/equipment-backend`, `paulwoods/equipment-frontend`, and
  `caddy:2-alpine`. Pinned image tags (e.g. `2.0.22`) keep deploys
  reproducible.

Production hardening present in `deployment/docker-compose.yml`:

- `restart: unless-stopped` on every service.
- JSON-file logging capped at `10m × 3` per container (anchor `&default-logging`).
- Per-service memory limits (`postgres: 1g`, `backend: 1g`, `frontend:
  512m`, `caddy: 128m`).
- `postgres` healthcheck (`pg_isready`) gating `backend.depends_on`.
- Postgres publishes no host port at all (2026-08-13): the backend reaches it
  over the compose network as `postgres:5432`. Binding it to `127.0.0.1:5432`
  kept it off the public interface but still exposed it to every co-tenant
  process on the vm, which — with the credentials in `.env` on the same
  filesystem — is a direct route around the application's authorization.
  Operator access is `docker compose exec postgres psql …`.

Image bumps go through `deployment/deploy.sh`:

```sh
./deploy.sh 2.0.23 2.0.23   # rewrites the docker-compose tags in place, pulls, ups
```

## Consequences

- **Positive:** an operator can clone, fill `.env`, and `docker compose up
  -d` on any Linux host.
- **Positive:** the deploy script gives a clean audit trail in git of which
  versions ran when (the file diff *is* the deploy log).
- **Negative:** no orchestration redundancy — host failure is downtime.
- **Negative:** image tags are mutable on Docker Hub; pin to digests if
  supply-chain integrity becomes a concern.
- **Open issue:** root `docker-compose.yml` mounts `./postgres_data`
  whereas `deployment/docker-compose.yml` mounts `./postgres-data` (note
  the dash). Don't run both compose files from the same host.
