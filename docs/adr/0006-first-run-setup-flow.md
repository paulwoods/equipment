# 6. First-run setup endpoint instead of seeded admin

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

Self-hosted deployments need a bootstrap admin account. Two common
approaches:

1. Seed an admin row in a Flyway migration with a hard-coded or
   env-injected password.
2. Detect "no users exist" at runtime and gate a one-shot setup endpoint.

Approach (1) bakes a credential into the deployment artifact or env file and
forces an immediate password reset. Approach (2) lets the operator pick the
credential interactively the first time they hit the site.

## Decision

Implement a runtime first-run flow:

- `GET /api/v1/setup/status` returns `{setupRequired: boolean}` based on
  `userService.isSetupRequired()` (true when the user table is empty).
- `POST /api/v1/setup` accepts an email and password, refuses with 409 if
  setup is no longer required, and otherwise creates a user with all four
  roles (`SYSTEM_ADMIN`, `ADMIN`, `EDIT`, `USER`) and immediately logs the
  caller in by issuing access + refresh cookies.
- Both endpoints are `permitAll()` in `SecurityConfig`.
- The frontend `App.tsx` queries `/setup/status` on mount; if `setupRequired`
  is true, `/login` redirects to `/setup` and `/setup` becomes the only
  reachable route.

## Consequences

- **Positive:** no shared default credentials live in the repo, deployment
  artifacts, or `.env.example`.
- **Positive:** the operator's first interaction sets a strong password;
  there's no "oh, the default was `admin/admin`" failure mode.
- **Negative:** anyone who can reach the deployment before the legitimate
  operator can claim the admin role. Mitigation depends on deployment
  topology — typically the operator hits `/setup` immediately after `docker
  compose up`. A future ADR may add an env-flag that disables the setup
  endpoint after a known timestamp.
- **Negative:** `setup/**` lives outside the rate limiter's skip list... no,
  it's actually skipped (`/api/v1/setup/` is in `ApiRateLimitFilter.SKIP_PATHS`).
  This means setup is not rate-limited; acceptable because the endpoint
  becomes a 409 immediately after first use.
