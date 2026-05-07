# 12. React Router v7 with cookie-driven auth gating

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The SPA has many protected routes (`/dashboard`, `/equipment/*`, `/users/*`,
`/profile`) and a handful of public ones (`/login`, `/forgot-password`,
`/reset-password`, `/setup`, `/about`, `/contact`). Auth state lives in an
HttpOnly cookie that JavaScript cannot read (ADR-0003), so the SPA must
discover its own session by calling the API.

## Decision

- Use **`react-router-dom` v7** with `BrowserRouter`.
- On boot, `App.tsx` calls `getMe()` and `getSetupStatus()` in parallel.
  Until both resolve, render `<></>` to avoid a login flash.
- Auth state (`email`, `userId`, `username`, `roles`) lives in a top-level
  `useState` and is propagated via `AuthContext`.
- A `ProtectedRoute` wrapper redirects unauthenticated users to
  `/login?returnTo=<path>` so the original destination is preserved.
- Setup-required state hijacks routing: when `setupRequired` is true,
  `/login` redirects to `/setup` and `/setup` is the only reachable route
  (see ADR-0006).
- A single `AppLayout` route element wraps all in-app pages so sidebar /
  topbar / breadcrumbs are not duplicated.

## Consequences

- **Positive:** auth state is sourced from the server at boot, so a
  refreshed page does not flash content the user shouldn't see.
- **Positive:** `returnTo` round-trip improves UX after token expiry.
- **Negative:** every page load makes an extra `/auth/me` call before
  render — acceptable, but caches no longer hit until that resolves.
- **Negative:** route protection is purely client-side; the server is the
  authoritative gate (every `/api/v1/*` mutation is checked against the
  JWT). Don't rely on the SPA to enforce authorization.
