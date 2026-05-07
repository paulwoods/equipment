# 9. Caddy as TLS-terminating reverse proxy

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The deployment serves both API (`/api/*`) and SPA (`/`) on a single domain
over HTTPS. Operators don't want to manually issue or renew TLS
certificates, and the project has no tolerance for hand-tuning nginx vhosts.

## Decision

Use **Caddy 2** as the front-door HTTPS terminator
(`deployment/Caddyfile`):

```
{$CADDY_DOMAIN} {
    encode zstd gzip
    header { Strict-Transport-Security ...  X-Content-Type-Options ...  Referrer-Policy ... }
    handle /api/* { reverse_proxy backend:8080 }
    handle        { reverse_proxy frontend:80 }
}
```

- Caddy auto-issues and renews Let's Encrypt certificates using the
  configured `CADDY_EMAIL`.
- Domain is injected via `CADDY_DOMAIN` from `.env` so the Caddyfile is
  environment-agnostic.
- Three baseline security headers are set at the edge in addition to the
  ones set by Spring Security on backend responses (defence in depth).
- The frontend container runs nginx internally on port 80, serving the Vite
  build output.

## Consequences

- **Positive:** TLS just works; no certbot cron jobs, no DNS-challenge
  scripting.
- **Positive:** single-domain SPA + API avoids cross-site cookie issues in
  production (see ADR-0003 — `SameSite=Lax` is sufficient because frontend
  and API share the eTLD+1).
- **Negative:** Caddy stores its ACME state in `./caddy_data` and
  `./caddy_config` volumes — these must be backed up alongside Postgres
  data, otherwise certificates are reissued on every fresh host (subject to
  Let's Encrypt rate limits).
- **Negative:** the dev compose (`docker-compose.yml` at repo root) does not
  use Caddy — only `deployment/docker-compose.yml` does. This is intentional
  but means dev and prod request paths differ.
