# 5. Many-to-many user/role model via join table

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06
- **Supersedes:** the original single-column `users.role` from `V1__create_schema.sql`

## Context

`V1__create_schema.sql` modelled authorization with a single
`users.role VARCHAR(50)` column — one role per user. Roles intended for the
system are `USER`, `EDIT`, `ADMIN`, `SYSTEM_ADMIN` (visible from
`SetupController` granting all four to the bootstrap admin).

The single-column model could not express:

- Role hierarchies (an `ADMIN` is also an `EDIT` is also a `USER`) without
  hard-coding precedence in code.
- Future roles being added to a subset of users without a migration.

## Decision

`V4__user_roles.sql` introduces:

- `roles(id UUID PK, name VARCHAR UNIQUE)` seeded with the four canonical
  role names.
- `user_roles(id, user_id FK, role_id FK, UNIQUE(user_id, role_id))` join
  table.
- A backfill that inserts one `user_roles` row per existing `users.role`
  value, then drops the column.

The Java side models this as `User → Set<UserRole>` with `RoleEntity`
referenced through a join entity (`UserRole`) — explicit join entity rather
than `@ManyToMany` annotation, which makes future fields on the join (e.g.
`granted_at`, `granted_by`) cheap to add.

## Consequences

- **Positive:** users can hold multiple roles; the bootstrap admin holds all
  four (see `SetupController.setup`).
- **Positive:** roles are data, not code — adding a role is an `INSERT`,
  not a deploy.
- **Negative:** every place that previously checked `user.getRole()` now
  iterates `user.getUserRoles()` — slightly more verbose, but eliminates the
  enum/string ambiguity that the old model had.
- **Negative:** the `UserResponse` DTO joins through two tables on every
  `/auth/me` call. Acceptable; `@ManyToOne` lazy fetching is in play.
