# 1. Spring Boot monolith with React SPA frontend

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The system tracks equipment, maintenance procedures, and procedure-execution
history — a CRUD-heavy domain with light scheduled work (weekly emails) and
modest concurrency. A small team (one primary author, per `pom.xml`/`scm`)
maintains the project. The application has to run on a single host with a
single Postgres instance and serve both an interactive UI and an API.

## Decision

Build a single Spring Boot 4.x backend (Java 25) plus a separate React 19
single-page application bundled with Vite. The two artifacts are deployed
together but built independently:

- `backend/` — Spring Boot, Spring Security, Spring Data JPA, Spring Mail,
  Actuator, springdoc OpenAPI.
- `frontend/` — React 19 + Vite 8 + TypeScript, served via nginx in
  production.
- `e2e/` — Playwright tests against the deployed pair.

The two communicate over a JSON REST API rooted at `/api/v1/**`, with Caddy
reverse-proxying both onto a single domain in production.

## Consequences

- **Positive:** clean separation of UI and API concerns; either side can be
  rebuilt and deployed independently; OpenAPI generation comes for free with
  springdoc; React's component ecosystem (Radix, shadcn) is available.
- **Positive:** the monolithic backend keeps domain logic in one Spring
  context — no inter-service calls, no distributed transactions.
- **Negative:** two build systems (Maven + npm/Vite) and two Dockerfiles to
  maintain.
- **Negative:** SPA-style auth requires care around cookies, CORS, and the
  fallback route for client-side routing (see ADR-0016).
