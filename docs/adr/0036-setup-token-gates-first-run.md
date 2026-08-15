# 36. First-run setup requires an operator token and fails closed without one

- **Status:** Accepted
- **Date:** 2026-08-13
- **Amends:** [ADR-0006](0006-first-run-setup-flow.md) (the "anyone who reaches the
  deployment first can claim the admin role" consequence, and its claim that the
  setup path is skipped by the API rate limiter — it is not)

## Context

`POST /api/v1/setup` is `permitAll()` and guarded only by
`AdminBootstrap.isSetupRequired()` (`userRepository.count() == 0`). ADR-0006
accepted the resulting race knowingly and left a future ADR to close it; the
2026-07-30 scan (finding 2) raised it again as reachable in practice.

The window is real: an attacker polls the open `/api/v1/setup/status`, sees
`setupRequired: true` on a fresh deploy, and posts first. They become the only
`SYSTEM_ADMIN`, and the legitimate operator's attempt then answers 409 with no
account to recover from. `ApiRateLimitFilter` does cover the path (contrary to
ADR-0006's note — `/api/v1/setup` is not in `SKIP_PATHS`), but its 100 req/min
ceiling is irrelevant to an attack that needs one well-timed request.

## Decision

Two guards, both required.

**A pre-shared token.** `app.setup-token` (`APP_SETUP_TOKEN`) must be supplied in
the setup POST body and is compared with `MessageDigest.isEqual`. Only whoever
provisioned the deployment can complete setup. It is checked in the controller
rather than as a bean-validation constraint, so a bad token answers 403 rather
than a 400 that names the offending field.

**Fail closed when unconfigured.** A blank `app.setup-token` refuses setup with
503 and logs the missing variable, rather than falling back to the old open
behaviour. An operator who forgets the variable gets a deployment that cannot be
set up; one who never learns of it would otherwise get a deployment anyone can
claim. The louder failure is the safer one.

**A dedicated per-IP limiter.** `SetupRateLimiterService` — the same
`WindowedCounter` machinery as the other limiters — allows
`app.setup-max-attempts` (5) posts per IP per `app.setup-window-ms` (15 min), so
the token cannot be guessed by volume. It is checked before anything else the
endpoint does.

## Consequences

- **Positive:** the deployment-window race is closed; winning it now also
  requires the operator's secret.
- **Positive:** `APP_SETUP_TOKEN` is a normal `.env` value alongside
  `APP_JWT_SECRET`, generated the same way, documented in both `.env.example`
  files.
- **Negative:** first-run setup gains a required configuration step. A fresh
  deploy without `APP_SETUP_TOKEN` cannot create its admin account — deliberate,
  and the 503 plus the server log says exactly what is missing.
- **Negative:** the setup form now has a third field, and the e2e admin seed has
  to present the token (`SETUP_TOKEN` in `global-setup.ts`).
- The status endpoint stays open and unthrottled beyond the general API filter.
  It leaks only whether setup is pending, which is not actionable without the
  token.
