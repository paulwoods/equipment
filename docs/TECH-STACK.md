# Technology Stack

Snapshot as of 2026-07-03 (backend 2.0.35 / frontend 2.0.33). Versions
drift — the authoritative sources are `equipment-backend/pom.xml`, the
two `package.json` files, and the compose files. Decision rationale
lives in [docs/adr/](adr/README.md); relevant ADRs are linked per row.

## Repository layout

Superproject with three git submodules ([ADR-0027](adr/0027-git-submodule-split.md)):

| Repo | Role |
|------|------|
| `equipment` | Deployment assets, docs/ADRs, submodule pointers |
| `equipment-backend` | Spring Boot REST API |
| `equipment-frontend` | React SPA |
| `equipment-e2e` | Playwright end-to-end suite |

## Backend (`equipment-backend`)

| Technology | Version | Notes |
|------------|---------|-------|
| Java | 25 | |
| Spring Boot | 4.1.0 | Web MVC, Security, Data JPA, Validation, Mail, Actuator ([ADR-0001](adr/0001-spring-boot-react-spa.md)) |
| PostgreSQL | 18 | UUID primary keys ([ADR-0002](adr/0002-postgres-with-flyway.md), [ADR-0021](adr/0021-uuid-primary-keys.md)) |
| Flyway | managed by Boot | Versioned migrations in `src/main/resources/db/migration` |
| JJWT | 0.13.0 | JWT access tokens in HttpOnly cookies ([ADR-0003](adr/0003-jwt-cookie-auth.md), [ADR-0029](adr/0029-token-version-revocation.md)) |
| Caffeine | managed by Boot | In-memory rate limiting ([ADR-0007](adr/0007-in-process-caffeine-rate-limit.md), [ADR-0026](adr/0026-in-memory-rate-limiting.md)) |
| ShedLock | 7.7.0 | JDBC-backed lock for the weekly dashboard email ([ADR-0014](adr/0014-scheduled-dashboard-email.md)) |
| springdoc-openapi | 3.0.3 | Swagger UI, authenticated-only |
| Lombok | managed by Boot | |
| Maven | via `./mvnw` wrapper | |

Testing: JUnit 5 + Mockito (unit), Testcontainers with PostgreSQL
(integration).

## Frontend (`equipment-frontend`)

| Technology | Version | Notes |
|------------|---------|-------|
| React | 19 | |
| TypeScript | 5.9 | |
| Vite | 8 | Build + dev server |
| Tailwind CSS | 4.1 | Semantic utilities; shadcn-style components ([ADR-0011](adr/0011-tailwind-shadcn-ui.md)) |
| Radix UI | various | Primitives under the shadcn components |
| React Router | 7 | Cookie-driven auth gating ([ADR-0012](adr/0012-react-router-auth-gating.md)) |
| Axios | 1.15 | `withCredentials` client ([ADR-0013](adr/0013-axios-with-credentials.md)) |
| EasyMDE / react-simplemde | 2.20 / 5.2 | Markdown editing for procedures ([ADR-0022](adr/0022-markdown-procedure-content.md)) |
| react-markdown | 10 | Markdown rendering |
| lucide-react | — | Icons |
| next-themes | — | Light/dark theme switching |

Testing: Vitest 4 + Testing Library (jsdom). Linting: ESLint 9 +
typescript-eslint.

## E2E (`equipment-e2e`)

| Technology | Version | Notes |
|------------|---------|-------|
| Playwright | 1.59 | Full-stack browser tests ([ADR-0015](adr/0015-playwright-e2e.md)) |

## Infrastructure & delivery

| Technology | Notes |
|------------|-------|
| Docker Compose | Single-host deploy ([ADR-0010](adr/0010-docker-compose-deploy.md)) |
| Caddy 2 (alpine) | TLS-terminating reverse proxy ([ADR-0009](adr/0009-caddy-reverse-proxy.md)) |
| nginx | Serves the built SPA in the frontend container |
| GitHub Actions | `publish.yml` per sub-repo builds/pushes `paulwoods/equipment-*` images and creates release tags ([ADR-0025](adr/0025-ci-managed-release-tags.md)) |
| Docker Hub | Image registry (`paulwoods/equipment-backend`, `-frontend`) |

Backend and frontend release versions move in lock-step
([ADR-0023](adr/0023-lockstep-versioning.md)).
