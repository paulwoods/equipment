# 2. PostgreSQL with Flyway-managed schema

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The application needs durable relational storage for equipment, procedures,
performance history, users, refresh tokens, and password reset tokens. UUID
primary keys are used throughout (see `gen_random_uuid()` defaults in
`V1__create_schema.sql`), and `ON DELETE CASCADE` is used to keep child rows
consistent.

## Decision

- Use **PostgreSQL 18** (pinned in both root and `deployment/docker-compose.yml`).
- Manage schema with **Flyway**, configured in `application.yml` to share the
  same datasource credentials as the application.
- Set `spring.jpa.hibernate.ddl-auto=validate` so Hibernate refuses to start
  if the schema diverges from the entity model.
- Disable `open-in-view` to keep transactional boundaries explicit.

Migrations live at `backend/src/main/resources/db/migration/`:

- `V1__create_schema.sql` — equipment / procedure / perform / users /
  refresh_token.
- `V2__add_user_name.sql`
- `V3__create_password_reset_token.sql`
- `V4__user_roles.sql` — split single-column `role` into many-to-many tables
  (see ADR-0005).

## Consequences

- **Positive:** schema evolution is auditable in version control; deployments
  are deterministic and ordered.
- **Positive:** `ddl-auto=validate` catches model/schema drift at boot
  rather than at first query.
- **Negative:** every schema change requires a new migration file —
  developers cannot rely on automatic schema generation in dev.
- **Negative:** Flyway has no native rollback; reversing a migration requires
  authoring a new forward migration.
