# RUNBOOK: migrate off the postgres superuser

Move the app from connecting as the `postgres` superuser against the default
`postgres` database to a dedicated non-superuser `equipment` role owning an
`equipment` database. Future apps sharing this Postgres instance get their own
role + database the same way.

**Do the local rehearsal first.** It is the same procedure as production, run
against a database you can afford to break.

## Prerequisites

- A backend image built from the commit containing this change is published to
  Docker Hub. The new image reads `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`;
  older images read the old `POSTGRES_*` scheme. The `.env` change and the
  image bump must land together.
- `deployment/init-app-db.sh` and the updated `docker-compose.yml` (which
  mounts it into `/docker-entrypoint-initdb.d`) are on the target machine.

## Local rehearsal

1. Update your local `.env` to match the new `.env.example`:
   - `POSTGRES_DB=postgres` (a real database name again, not a JDBC URL)
   - add `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/equipment`
   - add `SPRING_DATASOURCE_USERNAME=equipment`
   - add `SPRING_DATASOURCE_PASSWORD=<openssl rand -base64 24>`
2. Recreate the postgres container so it picks up the new env and the
   init-script mount (the existing data volume is untouched):

       docker compose up -d postgres

3. Check where your local data actually lives:

       docker compose exec postgres psql -U postgres -c '\l'
       docker compose exec postgres psql -U postgres -d postgres -c '\dt'

   If the tables are in the `postgres` database, continue; if they are
   somewhere else, substitute that database name in the dump step below.
4. Create the role and database (the init script only auto-runs on a fresh
   volume, so run it by hand):

       docker compose exec postgres bash /docker-entrypoint-initdb.d/init-app-db.sh

5. Copy the data. `--no-owner --no-acl` plus restoring *as* `equipment` makes
   every object land owned by `equipment`:

       docker compose exec postgres bash -c \
         'pg_dump -U postgres --no-owner --no-acl postgres | psql -v ON_ERROR_STOP=1 -U equipment -d equipment'

6. Verify — counts must match between old and new:

       docker compose exec postgres psql -U postgres -d postgres \
         -c 'SELECT count(*) FROM users' -c 'SELECT count(*) FROM equipment' -c 'SELECT count(*) FROM flyway_schema_history'
       docker compose exec postgres psql -U postgres -d equipment \
         -c 'SELECT count(*) FROM users' -c 'SELECT count(*) FROM equipment' -c 'SELECT count(*) FROM flyway_schema_history'

7. Start the backend (`cd equipment-backend && ./mvnw spring-boot:run`), log
   in, and confirm your data is there. Flyway should report the schema as
   up to date, not re-run migrations.
8. Once satisfied, drop the old copy (locally there is no reason to soak):

       docker compose exec postgres psql -U postgres -d postgres \
         -c 'DROP SCHEMA public CASCADE' -c 'CREATE SCHEMA public'

## Production cutover

On the droplet, the equipment services (backend, frontend, postgres) are run
by the compose file in `~/caddy`, alongside other apps. All `docker compose`
commands below run from that directory; the compose project is still named
`equipment`.

1. **Backup.** Run `backup.sh` (or the `pg_dumpall` line from it by hand)
   and confirm a fresh file exists in `~/caddy/pg-backups/`.
2. Copy `init-app-db.sh` to `~/caddy/` on the droplet and add the mount to
   the postgres service in `~/caddy/docker-compose.yml`:

       volumes:
         - ./postgres-data:/var/lib/postgresql
         - ./init-app-db.sh:/docker-entrypoint-initdb.d/init-app-db.sh:ro
3. Update the VM's `.env` exactly as in rehearsal step 1, except the URL host
   is the compose service name:

       SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/equipment

   Generate a fresh password: `openssl rand -base64 24`.

   The droplet splits env across `postgres.env` and `equipment.env` (unlike
   the single `.env` the reference compose uses). `init-app-db.sh` reads
   `SPRING_DATASOURCE_USERNAME`/`PASSWORD` from *inside the postgres
   container*, so those two vars must go into `postgres.env` as well as
   `equipment.env` — same password in both.
4. Stop writes: `docker compose stop backend`
5. Recreate postgres with the new config: `docker compose up -d postgres`
6. Create role + database:

       docker compose exec postgres bash /docker-entrypoint-initdb.d/init-app-db.sh

7. Copy the data (same command as rehearsal step 5).
8. Verify counts (same as rehearsal step 6). **Do not proceed if they differ.**
9. Deploy the new backend image (2.0.46 or later — earlier images read the
   old `POSTGRES_*` vars); this also recreates the backend with the new env
   vars. `deploy.sh` must live next to the compose file in `~/caddy`:

       ./deploy.sh <new-backend-version> <current-frontend-version>

10. Verify:
    - `docker compose ps` — backend healthy
    - `docker compose logs backend` — Flyway validates existing schema, no
      permission errors
    - log in to the app, spot-check data
11. Update the sanitized reference copies in this directory to mirror what is
    now deployed.

The old data stays in the `postgres` database as a fallback — see below.

## Rollback (if the cutover fails)

The old data in the `postgres` database is untouched, so rollback is
config-only:

1. Restore the previous `.env` values (`POSTGRES_DB` back to the old JDBC URL
   form, remove the `SPRING_DATASOURCE_*` lines).
2. Pin the previous backend image tag in `docker-compose.yml`.
3. `docker compose up -d`

## Cleanup — after a one-week soak

Wait about a week of normal use, which covers at least one weekly dashboard
email and several nightly backups of the new database. Then drop the old copy
from the `postgres` database:

    docker compose exec postgres psql -U postgres -d postgres \
      -c 'DROP SCHEMA public CASCADE' -c 'CREATE SCHEMA public'

Until this step, nightly `pg_dumpall` backups contain both copies of the data;
afterwards, only the `equipment` database.
