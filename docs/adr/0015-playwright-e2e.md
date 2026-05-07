# 15. Playwright as the end-to-end test stack

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The system has two unit-test surfaces (Maven Surefire on the backend,
Vitest + Testing Library on the frontend) but those don't exercise the
auth flow, cookie handling, or the SPA-API integration end-to-end.

## Decision

Maintain a separate `e2e/` module with Playwright:

- `playwright.config.ts` drives the test runner.
- `global-setup.ts` / `global-teardown.ts` provision and tear down test
  state.
- The backend exposes `/api/v1/test/**` (permitted in `SecurityConfig`,
  skipped by the rate limiter) so test runs can reset state without
  hitting the real auth flow. The endpoint surface is a deliberate
  test-only seam.
- Test artifacts (`playwright-report/`, `test-results/`) are kept out of
  version control.

The `e2e` package has its own `package.json` so its dependency tree
doesn't bleed into the production frontend bundle.

## Consequences

- **Positive:** real-browser coverage catches cookie / CORS / SPA-routing
  regressions that Vitest cannot.
- **Positive:** the `/test` namespace gives tests a fast path to set up
  fixtures without driving the UI for every precondition.
- **Negative:** the `/test` endpoints are `permitAll()` — they MUST be
  disabled or removed from production builds. Currently they are not
  gated by a profile or env flag; treat that as a known risk and address
  before any externally-exposed deployment.
- **Negative:** Playwright tests are slow and order-dependent if state
  isn't isolated. Investing in `global-setup` early pays off.
