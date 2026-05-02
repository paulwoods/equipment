# Deployment Review: `deployment/`

## Context

A best-practices review of the files in `deployment/`. The directory contains a Docker Compose stack (Postgres 18,
Spring Boot backend, Vite/nginx frontend, Caddy as TLS-terminating reverse proxy), an `.env` / `.env.example` pair, a
`restart.sh`, a `backup.sh`, a `Caddyfile`, and a local `.gitignore`.

This review covers all seven files plus the backend Dockerfile, frontend Dockerfile, and `application.yaml` to
understand how the env vars are wired up. Findings are ordered by severity.

---

## Verified facts

- `deployment/.env` is **not** committed (`git ls-files` confirms; root `.gitignore` ignores `.env`,
  `deployment/.gitignore` ignores `.env` again as belt-and-braces).
- Tracked files in `deployment/`: `Caddyfile`, `.env.example`, `.gitignore`, `backup.sh`, `docker-compose.yml`,
  `restart.sh`.
- `POSTGRES_DB` env var is consumed by **two** different things: the official `postgres` image expects a bare DB name;
  Spring Boot's `application.yaml` reads it as the full JDBC URL (`url: ${POSTGRES_DB}`). This is the root cause of
  several issues below.
- Backend and frontend Dockerfiles already define `HEALTHCHECK` directives. Compose is not using them.
- `APP_SMTP_USER` and `APP_SMTP_PASS` in `.env` are **unused** by the backend (`SPRING_MAIL_USERNAME` /
  `SPRING_MAIL_PASSWORD` are the live vars). `APP_SMTP_FROM` is used via Spring's relaxed binding to `app.smtp-from`.
- A stray `./postgres_data/` directory exists at the project root (left over from a previous run).

---

## CRITICAL — fix before next deploy

### 1. `POSTGRES_DB` is being misused as a JDBC URL

`deployment/.env`:

```
POSTGRES_DB=jdbc:postgresql://postgres:5432/postgres
```

The `postgres:18` entrypoint will literally try to `CREATE DATABASE "jdbc:postgresql://postgres:5432/postgres"` on first
boot. Spring Boot, meanwhile, treats the same value as a JDBC URL and connects to the default `postgres` database. It "
works" by accident and leaves a junk database behind.

**Fix:** introduce a separate variable for the JDBC URL and make `POSTGRES_DB` a real DB name.

- `deployment/.env` and `.env.example`:
  ```
  POSTGRES_DB=equipment
  POSTGRES_USER=equipment
  POSTGRES_PASSWORD=...
  SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/equipment
  ```
- `backend/src/main/resources/application.yaml` lines 6 and 18: replace `${POSTGRES_DB}` with
  `${SPRING_DATASOURCE_URL}` (Spring Boot will also auto-bind `SPRING_DATASOURCE_URL` if you remove the `url:` line, but
  explicit is fine).
- This is a **data-affecting change**. The existing prod DB is called `postgres`. Either keep `POSTGRES_DB=postgres` and
  only fix the JDBC URL, or do a one-shot migration (`pg_dump` → restore into `equipment`). Recommend the former for the
  immediate fix and a planned migration later.

### 2. `.gitignore` typo: `postgres_data/` vs. real volume `postgres-data/`

`deployment/docker-compose.yml:9` mounts `./postgres-data` (hyphen). `deployment/.gitignore:2` ignores
`postgres_data/` (underscore). If anyone runs `docker compose up` from `deployment/` on a machine where the repo is
checked out, the Postgres data dir will be tracked by git.

**Fix:** change `deployment/.gitignore` to `postgres-data/` (and keep `postgres_data/` only if the legacy
`./postgres_data/` at the repo root needs ignoring — but that one belongs in the **root** `.gitignore`, not the
deployment one). Recommend simply:

```
postgres-data/
caddy_data/
caddy_config/
sql/
.env
```

Adding `sql/` because `backup.sh` writes there.

### 3. Postgres volume mount does not match `PGDATA`

```
volumes:
  - ./postgres-data:/var/lib/postgresql
```

with `PGDATA=/var/lib/postgresql/18/docker`. Functionally this works (data ends up at `./postgres-data/18/docker/` on
the host), but it is non-standard and traps everything else under `/var/lib/postgresql` inside the bind mount, including
the `postgres` Linux user's home dir.

**Fix:** mount the PGDATA path directly and drop the custom `PGDATA`:

```yaml
volumes:
  - ./postgres-data:/var/lib/postgresql/data
```

Remove `PGDATA=...` from `.env` / `.env.example`. **This requires a one-shot data migration** on the production host (
move existing files to the new layout) or you can leave the current layout alone — the only cost is the unconventional
structure. If you choose to leave it, document the choice in a comment in `docker-compose.yml`.

### 4. `backup.sh` will not run as documented

Three problems in `backup.sh`:

1. The cron example is `0 1 * * 1` — that is **Monday only**, not daily. Should be `0 1 * * *`.
2. The cron example is `docker exec -t ~/equipment/backup.sh` — that command is malformed (`docker exec` needs a
   container name and an in-container command). The intent is `0 1 * * * ~/equipment/backup.sh`.
3. Hardcoded container name `equipment-postgres-1`. Compose derives the project name from the directory (`deployment/`),
   so the actual container is **`deployment-postgres-1`**, and the backup will silently fail.

**Fix:**

- Add `name: equipment` at the top of `docker-compose.yml` (Compose v2.21+) so container names are deterministic; OR use
  `docker compose -f ~/equipment/deployment/docker-compose.yml exec -T postgres pg_dumpall ...` from the script.
- Add error handling so a failed `pg_dumpall` does not produce a tiny gzipped error file that overwrites a real backup
  the next day:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  BACKUP_DIR="$HOME/equipment/sql"
  mkdir -p "$BACKUP_DIR"
  TS=$(date -Iseconds)
  TMP="$BACKUP_DIR/.${TS}.sql.gz.tmp"
  docker compose -f "$HOME/equipment/deployment/docker-compose.yml" exec -T postgres \
    pg_dumpall -U "${POSTGRES_USER:-postgres}" | gzip > "$TMP"
  mv "$TMP" "$BACKUP_DIR/${TS}.sql.gz"
  find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +30 -delete
  ```
- Fix the cron comment to `0 1 * * * ~/equipment/backup.sh`.

### 5. Real production secrets are sitting in `deployment/.env` on the dev machine

`.env` is not committed, but the file on disk holds the live Postgres password, Gmail app password, and JWT secret. That
is one accidental `tar`, `cp -r`, or stolen-laptop scenario away from a credential leak.

- **Don't keep prod secrets on the dev box.** Keep them only on the production host. Use a separate `dev` `.env` locally
  with throwaway values.
- Strongly consider **rotating** all three secrets (DB password, Gmail app password, JWT secret) given they have been on
  a dev workstation. Rotating the JWT secret will invalidate all active sessions — schedule it.

### 6. JWT secret is shorter than the example recommends

`.env`: `APP_JWT_SECRET=1ilzNVUBCohPwUq07T8fxa7VJ9DrH7Vn` (32 chars). `.env.example` correctly tells you to generate
with `openssl rand -base64 48`. Use 48+ bytes of entropy when you rotate.

---

## HIGH — reliability and operability

### 7. `depends_on` doesn't actually wait for Postgres

Compose's short-form `depends_on: [postgres]` only waits for the container to **start**, not to be ready. On a cold boot
the backend can race ahead and crash-loop until Postgres is accepting connections. Both your app images already have
`HEALTHCHECK` instructions; the missing piece is a Postgres healthcheck and `condition: service_healthy` wiring.

**Fix** in `docker-compose.yml`:

```yaml
postgres:
  healthcheck:
    test: [ "CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB" ]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s

backend:
  depends_on:
    postgres:
      condition: service_healthy

caddy:
  depends_on:
    backend:
      condition: service_started   # backend's own HEALTHCHECK keeps it serving
    frontend:
      condition: service_started
```

### 8. `:latest` image tags for backend and frontend

`paulwoods/equipment-backend:latest` and `paulwoods/equipment-frontend:latest` make rollback impossible and cause "works
on the registry, breaks on prod" surprises. The CI workflow that pushes these images presumably also tags them with a
version or git SHA — pin to that tag in `docker-compose.yml`.

If you want to keep convenience for "always pull newest", the right pattern is:

- `docker-compose.yml` → pinned tag (e.g. `:1.7.4` or `:${APP_VERSION}`)
- A separate `deploy.sh` that updates the tag and runs `docker compose up -d`.

### 9. `restart.sh` causes unnecessary downtime

```bash
docker compose down
docker compose pull
docker compose up -d
```

`down` removes containers and networks — a couple of seconds of full outage even when nothing changed. `up -d` after a
`pull` already recreates only the services whose image changed.

**Fix:**

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
```

(Drop the trailing `logs` — it tails forever and blocks the cron/SSH session if you ever invoke it non-interactively.)

### 10. Caddyfile hardcodes domain and email; env vars in `.env` are not used

`.env` defines `CADDY_DOMAIN` and `CADDY_EMAIL`, but the Caddyfile literally says `mrpaulwoods.com` and
`mr.paul.woods@gmail.com`. The env vars are dead.

**Fix:**

```caddy
{
    email {$CADDY_EMAIL}
}

{$CADDY_DOMAIN} {
    encode zstd gzip

    handle /api/* {
        reverse_proxy backend:8080
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

This makes the Caddyfile reusable across staging/prod and removes a footgun where someone updates `.env` and is
surprised nothing changed.

---

## MEDIUM — best practice

### 11. Add basic security headers in Caddy

You already have TLS via Caddy. Add HSTS and a few standard headers globally:

```caddy
{$CADDY_DOMAIN} {
    encode zstd gzip

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        # X-Frame-Options is legacy; CSP frame-ancestors is the modern equivalent.
        # Add a CSP only after confirming it doesn't break the SPA.
    }

    handle /api/* { reverse_proxy backend:8080 }
    handle      { reverse_proxy frontend:80 }
}
```

### 12. Resource limits on containers

No CPU/memory caps on any service. A runaway backend (e.g. a memory leak) will OOM the whole VM and take Postgres with
it. Add modest limits, e.g.:

```yaml
backend:
  deploy:
    resources:
      limits:
        memory: 1g
```

(Compose supports `deploy.resources.limits` outside Swarm in recent versions.)

### 13. DRY the duplicated `logging:` block

All four services repeat the same json-file logging block. Use a YAML anchor:

```yaml
x-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  postgres:
    logging: *default-logging
  ...
```

### 14. Frontend port comment is wrong

`docker-compose.yml:35` has a commented-out `127.0.0.1:80:81`. The frontend container exposes 80 (per its Dockerfile),
not 81. If you ever uncomment it expecting it to work, you will be confused. Either fix to `80:80` or delete the
comment.

### 15. Remove unused `APP_SMTP_USER` / `APP_SMTP_PASS`

These are duplicates of `SPRING_MAIL_USERNAME` / `SPRING_MAIL_PASSWORD` and not referenced anywhere in the backend.
Remove from `.env` and `.env.example` to reduce confusion.

### 16. `APP_SMTP_FROM` quoting

`.env`:

```
APP_SMTP_FROM="'Equipment Management' <mr.paul.woods@gmail.com>"
```

The double-quoted-around-single-quoted display name is unusual. Test once by sending a real email; if Gmail shows the
From as expected, leave it. If it shows `'Equipment Management'` with literal single quotes, switch to:

```
APP_SMTP_FROM=Equipment Management <mr.paul.woods@gmail.com>
```

(Spring's `JavaMailSender` handles the quoting itself.)

---

## LOW — cosmetic / consistency

- `docker-compose.yml` has no `name:` — adding `name: equipment` makes container names predictable (and unblocks fix #4
  cleanly).
- `restart.sh` is missing `set -euo pipefail` and doesn't `cd "$(dirname "$0")"`, so it only works if you're already in
  `deployment/`.
- The stray `./postgres_data/` at the repo root looks like leftover state from an old config. Once confirmed it isn't
  the live DB, it can be removed.
- Consider adding a top-of-file comment in `docker-compose.yml` summarizing how to run the stack and where data lives.

---

## Summary table

| #  | File                         | Severity | Fix                                                                   |
|----|------------------------------|----------|-----------------------------------------------------------------------|
| 1  | `.env`, `application.yaml`   | CRITICAL | Split `POSTGRES_DB` (DB name) from `SPRING_DATASOURCE_URL` (JDBC URL) |
| 2  | `.gitignore`                 | CRITICAL | `postgres_data/` → `postgres-data/`; add `sql/`                       |
| 3  | `docker-compose.yml`, `.env` | CRITICAL | Mount `/var/lib/postgresql/data`; drop custom `PGDATA` (or document)  |
| 4  | `backup.sh`                  | CRITICAL | Daily cron, real container name, `set -euo pipefail`, atomic write    |
| 5  | `.env` (workstation)         | CRITICAL | Don't keep prod secrets on dev; rotate the three live secrets         |
| 6  | `.env`                       | CRITICAL | Regenerate `APP_JWT_SECRET` with 48-byte entropy on rotation          |
| 7  | `docker-compose.yml`         | HIGH     | Postgres healthcheck + `condition: service_healthy` on backend        |
| 8  | `docker-compose.yml`         | HIGH     | Pin image tags instead of `:latest`                                   |
| 9  | `restart.sh`                 | HIGH     | Replace `down` with `pull` + `up -d`; drop `logs`; harden bash        |
| 10 | `Caddyfile`                  | HIGH     | Use `{$CADDY_DOMAIN}` and `{$CADDY_EMAIL}`                            |
| 11 | `Caddyfile`                  | MEDIUM   | Add HSTS, X-Content-Type-Options, Referrer-Policy                     |
| 12 | `docker-compose.yml`         | MEDIUM   | Add memory limits per service                                         |
| 13 | `docker-compose.yml`         | MEDIUM   | Use YAML anchor for logging config                                    |
| 14 | `docker-compose.yml`         | MEDIUM   | Frontend comment says `:81`; container is 80                          |
| 15 | `.env`, `.env.example`       | MEDIUM   | Remove unused `APP_SMTP_USER`, `APP_SMTP_PASS`                        |
| 16 | `.env`                       | MEDIUM   | Verify `APP_SMTP_FROM` quoting renders correctly                      |

---

## Recommended implementation order

Grouped into phases by risk and dependency. Each phase is safe to ship on its own; complete a phase and verify before
moving to the next.

### Phase 1 — Local-only quick wins (no prod impact, no downtime)

These are small edits to repo files. Land them in one PR.

1. **#2** Fix `.gitignore` typo (`postgres_data/` → `postgres-data/`, add `sql/`).
2. **#14** Fix the wrong `:81` port comment in `docker-compose.yml`.
3. **#15** Remove unused `APP_SMTP_USER` / `APP_SMTP_PASS` from `.env` and `.env.example`.
4. **#13** DRY the duplicated `logging:` blocks with a YAML anchor.
5. **LOW** Add `name: equipment` to `docker-compose.yml` (this also unblocks #4).
6. **LOW** Harden `restart.sh` with `set -euo pipefail` and `cd "$(dirname "$0")"`.

Verify: `docker compose config` parses cleanly; `git status` shows no surprise tracked files.

### Phase 2 — Operational fixes (prod-safe, deploy at any time)

These improve reliability and reduce blast radius without touching data or secrets.

7. **#4** Rewrite `backup.sh` with error handling, real container name (depends on `name: equipment` from Phase 1),
   atomic write, and `mkdir -p`. Fix the cron comment to `0 1 * * *`.
8. **#9** Replace `down` with `pull` + `up -d` in `restart.sh`.
9. **#10** Switch the Caddyfile to `{$CADDY_DOMAIN}` / `{$CADDY_EMAIL}`.
10. **#11** Add security headers (HSTS, X-Content-Type-Options, Referrer-Policy) to the Caddyfile.

Verify on prod: run `./backup.sh` manually and confirm a valid `.sql.gz` lands in `~/equipment/sql/`;
`curl -I https://mrpaulwoods.com` shows the new headers.

### Phase 3 — Reliability hardening (needs a brief restart window)

11. **#7** Add the Postgres healthcheck and `condition: service_healthy` wiring.
12. **#12** Add memory limits per service (start conservative — `1g` backend, `512m` frontend, `1g` postgres, `128m`
    caddy — and tune from real usage).

Verify: `docker compose up -d` cold-boot shows `postgres` reaching `(healthy)` before backend starts; `docker stats`
shows containers respecting limits under load.

### Phase 4 — Image versioning (needs CI coordination)

13. **#8** Pin image tags. Confirm the CI workflow that publishes to Docker Hub is also pushing a versioned tag (git SHA
    or semver). Switch `docker-compose.yml` to that tag and add a small `deploy.sh` that bumps the tag and runs `up -d`.

Verify: a deploy can be rolled back by changing one line and re-running `up -d`.

### Phase 5 — Database refactor (coordinated change, plan a window)

These two are bundled because they both touch the Postgres container's startup behavior and you want one restart, not
two.

14. **#1** Split `POSTGRES_DB` (DB name) from `SPRING_DATASOURCE_URL` (JDBC URL).
15. **#3** Move the volume mount to `/var/lib/postgresql/data` and drop the custom `PGDATA` — *or* explicitly document
    the current layout and skip this one. If you skip it, the only cost is non-standard layout; no functional issue.

Two safe paths for #1:

- **Path A — minimal (recommended for first pass):** keep `POSTGRES_DB=postgres` so the existing live database is
  untouched; only fix the JDBC URL by adding `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/postgres` and
  updating `application.yaml`. Zero data migration.
- **Path B — full rename (later):** `pg_dump` from `postgres` → restore into a new `equipment` DB → switch the JDBC
  URL → drop the old DB after a soak period.

Verify: backend logs show Hikari connecting to the correct DB; Flyway history table is intact; smoke test the app end to
end.

### Phase 6 — Secret rotation (scheduled, will log users out)

16. **#5** Remove prod `.env` from this dev workstation; keep prod-only on the prod host. Replace local `.env` with
    throwaway dev values.
17. **#6** Rotate `APP_JWT_SECRET` (48 bytes via `openssl rand -base64 48`), `POSTGRES_PASSWORD`, and the Gmail app
    password. Communicate the JWT rotation timing — every active session is invalidated.
18. **#16** While you're in `.env`, verify `APP_SMTP_FROM` quoting by sending a test email and confirming Gmail renders
    the From correctly.

Verify: app boots with the new secrets; password reset email arrives with the right From; existing users are signed out
and can sign back in.

---

## Verification (after fixes are applied)

1. **Local stack-up smoke test** on a fresh machine or after `docker compose down -v`:
   ```
   cd deployment
   cp .env.example .env  # fill in dev values
   docker compose up -d
   docker compose ps   # all four healthy
   curl -fsS http://localhost/  # via Caddy in dev profile, or hit the frontend directly
   ```
2. **Postgres healthcheck** — `docker compose ps` should show `postgres` as `(healthy)` within ~30s; `backend` should
   not start until then.
3. **Backup** — run `./backup.sh` manually; confirm a non-empty `~/equipment/sql/<timestamp>.sql.gz` is produced and
   `gunzip -t` succeeds.
4. **Restart** — run `./restart.sh` while curl-ing the public domain in a loop; outage window should be sub-second per
   service rather than the multi-second gap that `down` causes today.
5. **Caddy headers** — `curl -I https://mrpaulwoods.com` should show the new security headers.
6. **JDBC URL change** — backend logs at startup should show "HikariPool ... Start completed" against `equipment` (not
   `postgres`) once the migration is done; `flyway_schema_history` should be in the new DB.

---

## Critical files referenced

- `deployment/docker-compose.yml`
- `deployment/.env`
- `deployment/.env.example`
- `deployment/.gitignore`
- `deployment/Caddyfile`
- `deployment/restart.sh`
- `deployment/backup.sh`
- `backend/src/main/resources/application.yaml` (impacted by fix #1)
