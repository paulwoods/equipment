# 28. Tiered role authorization via method-level `@PreAuthorize`

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03
- **Related:** ADR-0005 (many-to-many user/role model), ADR-0008 (stateless server)

## Context

ADR-0005 records how roles are *stored* (join table, four canonical
roles: `USER`, `EDIT`, `ADMIN`, `SYSTEM_ADMIN`) but not how they are
*enforced*. The enforcement scheme is visible across the controllers
and `UserService` but was never written down, and its implicitness has
already produced a real bug: `PerformHistoryController` shipped with
`hasAnyRole('ADMIN', 'USER')`, silently excluding `EDIT` and
`SYSTEM_ADMIN` (fixed 2026-07-02).

The observable convention:

- `SecurityConfig` does coarse gating only — `permitAll` for
  auth/setup/version endpoints, `authenticated()` for everything else.
  It never mentions roles.
- Role checks live on controller methods as `@PreAuthorize`:
  - **Read** endpoints (GET): `hasAnyRole('USER', 'EDIT', 'ADMIN', 'SYSTEM_ADMIN')`
  - **Write** endpoints (POST/PUT/DELETE) on domain resources:
    `hasAnyRole('EDIT', 'ADMIN', 'SYSTEM_ADMIN')`
  - **User management** endpoints: `ADMIN` / `SYSTEM_ADMIN` only.
- There is no Spring `RoleHierarchy` bean — the "hierarchy" is
  emulated by enumerating every role that qualifies, at every
  annotation.
- Business-rule refinements sit in the service layer:
  `UserService.assertCallerCanManageRole` lets `SYSTEM_ADMIN` manage
  any role while restricting `ADMIN`, and self-modification rules
  (can't edit own account, can't drop own `SYSTEM_ADMIN`) are enforced
  there too.

## Decision

Keep authorization at the controller-method level with explicit
role enumeration, tiered as: **read = any authenticated role, write =
`EDIT` and above, user management = `ADMIN` and above**, with
service-layer checks for rules that depend on *which* user or role is
being acted on. `SYSTEM_ADMIN` must appear in every role list — it is
the superset role.

This ADR exists chiefly to make the convention enforceable in review:
a new endpoint whose `@PreAuthorize` doesn't match one of the three
tiers is presumptively wrong.

## Consequences

- **Positive:** every endpoint's access policy is readable at its
  declaration site; no hidden hierarchy resolution.
- **Positive:** method-level security composes with the stateless JWT
  filter (ADR-0008) without extra infrastructure.
- **Negative:** enumerating roles at every annotation is repetitive
  and copy-paste-fragile — the `PerformHistoryController` bug is the
  proof. Adding a fifth role means touching every annotation.
  Mitigations if this recurs: a `RoleHierarchy` bean, or shared
  constants like `@PreAuthorize(Roles.CAN_WRITE)`.
- **Negative:** the split between annotation checks and service-layer
  checks means no single place shows the whole policy for a resource.
