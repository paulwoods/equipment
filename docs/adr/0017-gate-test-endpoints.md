# 17. Delete the unused `TestResetController` and its configuration footprint

- **Status:** Accepted
- **Date:** 2026-05-06
- **Related:** ADR-0015 (Playwright e2e)

## Context

`TestResetController` exposed a single endpoint, `DELETE /api/v1/test/reset`,
which wiped `refresh_token` and `users` in one transaction. It was annotated
`@Profile("test")`, so the bean was only registered when the `test` profile
was active.

Two pieces of configuration acknowledged the path:

- `SecurityConfig.filterChain` — `.requestMatchers("/api/v1/test/**").permitAll()`.
- `ApiRateLimitFilter.SKIP_PATHS` — `"/api/v1/test/"`.

A repository-wide search at the time of this decision found **no callers**:

- The Playwright global setup/teardown (`e2e/global-setup.ts`,
  `e2e/global-teardown.ts`) gives each test run a dedicated, throwaway
  Postgres container (`equipment-e2e-postgres` on port 15432) and
  `docker rm -f`s it on teardown. State isolation is achieved at the
  container level, not via an HTTP reset.
- The single substantive Playwright test (`tests/signup-flow.spec.ts`)
  drives the UI from `localhost:5173` and never calls `/api/v1/test/*`.
- No backend test under `backend/src/test/...` references the endpoint.

The controller was dead code with database-wipe authority. That is strictly
worse than dead code without — a future contributor could re-enable the
`test` profile in a misconfigured environment, or could copy-paste the
controller into a sibling that forgets the `@Profile` annotation.

## Decision

Delete the controller and its configuration footprint:

1. Remove `backend/src/main/java/.../controller/TestResetController.java`.
2. Remove the `.requestMatchers("/api/v1/test/**").permitAll()` line from
   `SecurityConfig.filterChain`.
3. Remove `"/api/v1/test/"` from `ApiRateLimitFilter.SKIP_PATHS`.

If a future test ever needs an HTTP-level state reset (rather than a fresh
container), the simpler answer is: re-introduce a narrower endpoint at that
time, scoped exactly to what the test needs, gated by `@Profile("test")`,
and called explicitly from `test.beforeEach` so its lifetime is visible at
the call site. Write a successor ADR to record the reintroduction.

## Consequences

- **Positive:** removes a destructive code path entirely — no annotation,
  profile, or matcher accident can re-expose what does not exist.
- **Positive:** `SecurityConfig` and `ApiRateLimitFilter` no longer contain
  references to a path that never serves traffic, removing investigative
  load for future readers and security reviewers.
- **Positive:** the e2e setup's container-per-run isolation is now the only
  test-isolation story, which is consistent with how the suite already
  behaves.
- **Negative:** if there were any out-of-tree consumers (a private branch,
  a developer's local script) they will now 404. Considered low risk given
  the test surface is sparse.
- **Negative:** when a second e2e test that needs an empty DB *and*
  preserves the running container is eventually written, someone will
  need to reintroduce a focused reset endpoint. That cost is paid only
  if and when the need actually appears.

## What was rejected

- **Keep the controller and add a CI smoke test that asserts
  `DELETE /api/v1/test/reset` returns 404 in non-`test` profiles.** This
  was the prior draft of this ADR. Rejected because it pays ongoing
  maintenance cost (a test that exists to verify dead code stays dead) to
  protect a feature with no current consumers.
- **Keep the controller for "future use."** Speculative retention is how
  destructive code paths quietly survive. Better to delete now and
  reintroduce with intent later.
