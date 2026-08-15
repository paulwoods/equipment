# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Equipment
project. The records here were **reverse-engineered from the codebase as of
2026-05-06** — the decisions described were not authored at the time they were
made. The *what* is verifiable from the code; the *why* is reconstructed from
context (defaults, dependency choices, migration history, code comments) and
should be treated as the most plausible reading rather than gospel.

Format: short-form [MADR](https://adr.github.io/madr/) — Status / Context /
Decision / Consequences.

## Index

| #    | Title                                                                              | Status   |
|------|------------------------------------------------------------------------------------|----------|
| 0001 | [Spring Boot monolith with React SPA frontend](0001-spring-boot-react-spa.md)      | Accepted |
| 0002 | [PostgreSQL with Flyway-managed schema](0002-postgres-with-flyway.md)              | Accepted |
| 0003 | [JWT access token + opaque refresh token, both as HttpOnly cookies](0003-jwt-cookie-auth.md) | Accepted |
| 0004 | [Refresh-token rotation on every refresh](0004-refresh-token-rotation.md)          | Accepted |
| 0005 | [Many-to-many user/role model via join table](0005-many-to-many-user-roles.md)     | Accepted |
| 0006 | [First-run setup endpoint instead of seeded admin](0006-first-run-setup-flow.md)   | Accepted |
| 0007 | [In-process Caffeine rate limiting per-IP](0007-in-process-caffeine-rate-limit.md) | Accepted |
| 0008 | [Stateless server with `SessionCreationPolicy.STATELESS`](0008-stateless-server.md) | Accepted |
| 0009 | [Caddy as TLS-terminating reverse proxy](0009-caddy-reverse-proxy.md)              | Accepted |
| 0010 | [Docker Compose for single-host deployment](0010-docker-compose-deploy.md)         | Accepted |
| 0011 | [Tailwind v4 + shadcn/Radix component library](0011-tailwind-shadcn-ui.md)         | Accepted |
| 0012 | [React Router v7 with cookie-driven auth gating](0012-react-router-auth-gating.md) | Accepted |
| 0013 | [Axios client with `withCredentials` for cookie auth](0013-axios-with-credentials.md) | Accepted |
| 0014 | [Spring `@Scheduled` for weekly dashboard email](0014-scheduled-dashboard-email.md) | Accepted |
| 0015 | [Playwright as the end-to-end test stack](0015-playwright-e2e.md)                  | Accepted |
| 0016 | [SPA fallback served from Spring static resources](0016-spa-fallback-static.md)    | Accepted |
| 0017 | [Delete the unused `TestResetController` and its configuration footprint](0017-gate-test-endpoints.md) | Accepted |
| 0018 | [Re-evaluate CSRF posture if cross-origin or embed scenarios appear](0018-csrf-posture-revisit.md) | Accepted |
| 0019 | [Normalize Postgres data volume path across compose files](0019-normalize-postgres-volume-paths.md) | Accepted |
| 0020 | [RFC 7807 `application/problem+json` for API error responses](0020-rfc7807-problem-details.md) | Accepted |
| 0021 | [UUID primary keys on every entity](0021-uuid-primary-keys.md)                      | Accepted |
| 0022 | [Markdown as the persistence format for procedure content](0022-markdown-procedure-content.md) | Accepted |
| 0023 | [Lock-step versioning of backend and frontend artifacts](0023-lockstep-versioning.md) | Accepted |
| 0024 | [Fail-fast on weak `APP_JWT_SECRET` at application startup](0024-jwt-secret-fail-fast.md) | Accepted |
| 0025 | [CI creates the git tag for every published image](0025-ci-managed-release-tags.md) | Accepted |
| 0026 | [Rate limiting is in-memory and assumes a single backend instance](0026-in-memory-rate-limiting.md) | Accepted |
| 0027 | [Split the monorepo into a superproject with git submodules](0027-git-submodule-split.md) | Accepted |
| 0028 | [Tiered role authorization via method-level `@PreAuthorize`](0028-tiered-role-authorization.md) | Accepted |
| 0029 | [JWT revocation via a per-user token-version claim](0029-token-version-revocation.md) | Accepted |
| 0030 | [Refresh and password-reset tokens are stored as SHA-256 hashes](0030-tokens-hashed-at-rest.md) | Accepted |
| 0031 | [Optimistic locking with `@Version` — concurrent edits fail with 409](0031-optimistic-locking.md) | Accepted |
| 0032 | [Auth endpoints do not reveal whether an account exists](0032-auth-anti-enumeration.md) | Accepted |
| 0033 | [One `app-url` property for every user-facing link](0033-single-public-url.md) | Accepted |
| 0034 | [Google sign-in verifies an ID token rather than running an OAuth redirect](0034-google-id-token-sign-in.md) | Accepted |
| 0035 | [Login throttling counts the IP and the account independently, in one step](0035-two-axis-atomic-login-throttling.md) | Accepted |
| 0036 | [First-run setup requires an operator token and fails closed without one](0036-setup-token-gates-first-run.md) | Accepted |

## Conventions

- New ADRs get a sequential 4-digit ID. Once published, IDs are immutable.
- Superseded decisions are not edited — write a new ADR that references the
  old one and flip the old record's status to `Superseded by ADR-NNNN`.
- File name format: `NNNN-kebab-case-title.md`.
