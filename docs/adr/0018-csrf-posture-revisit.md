# 18. Re-evaluate CSRF posture if cross-origin or embed scenarios appear

- **Status:** Accepted (review trigger, not an immediate change)
- **Date:** 2026-05-06
- **Related:** ADR-0003 (JWT cookies), ADR-0008 (stateless server)

## Context

`SecurityConfig.filterChain` calls `csrf(AbstractHttpConfigurer::disable)`.
The current defence against cross-site request forgery is layered:

1. **`SameSite=Lax` on auth cookies** — modern browsers won't send the
   cookies on cross-site `POST`/`PUT`/`DELETE` initiated by another
   origin's HTML.
2. **CORS allow-list** — `WebConfig.addCorsMappings` permits only the
   origins in `APP_CORS_ALLOWED_ORIGINS` with `allowCredentials(true)`.
   Browsers will block credentialed XHR/fetch from any other origin.
3. **HttpOnly cookies** — JavaScript on the same origin cannot read or
   exfiltrate the access token (XSS-mitigation, not CSRF, but
   complementary).
4. **`X-Frame-Options: DENY`** (`SecurityConfig.filterChain`) —
   browsers refuse to render the SPA inside any `<iframe>`, blocking
   the clickjacking and cross-origin-embed attack classes outright.
5. **Cookie-only JWT extraction** — `JwtAuthFilter.doFilterInternal`
   reads the access token *only* from the `access_token` cookie. There
   is no `Authorization: Bearer` fallback. External (non-SPA) clients
   therefore cannot authenticate at all without a code change, which
   is itself a trigger for revisiting this ADR.

This combination is acceptable **for a same-origin SPA on a
modern-browser audience**, which is exactly the deployment topology
today (Caddy serves SPA and API on one domain).

### Where the assumption is tightest

`EquipmentController.@PostMapping("/import",
consumes = MediaType.MULTIPART_FORM_DATA_VALUE)` is the **only**
state-changing endpoint that the browser treats as a CORS "simple"
request — multipart POSTs do not trigger a preflight. For every other
mutation (JSON bodies, or `PUT`/`PATCH`/`DELETE` verbs) preflight
provides a second layer alongside `SameSite=Lax`. For `/import`,
`SameSite=Lax` is **load-bearing on its own**: a cross-origin HTML
form *can* fire the request, and only the cookie-suppression rule
keeps it unauthenticated.

This is fine today, but it means `/import` is the first endpoint that
becomes exploitable if cookies are ever flipped to `SameSite=None` or
if the import path grows an unauthenticated mode.

It is **not sufficient** in any of these futures:

- Embedding the SPA inside a third-party origin (an iframe, an
  enterprise portal).
- Issuing API tokens for use by external integrations that are not the
  SPA.
- Supporting browsers that do not honor `SameSite=Lax` defaults
  (legacy embedded webviews, some IoT/kiosk browsers).
- Adding a `POST` form submission flow that doesn't go through the
  axios client (e.g. a server-rendered admin page).

## Decision

Treat ADR-0003's CSRF stance as **conditionally accepted**. This ADR
records the trigger conditions for revisiting it:

- Any new client outside the same registrable domain.
- Any non-XHR mutation path (HTML form posts, redirected POSTs).
- Any change to cookie `SameSite` policy (e.g. `None` for cross-site
  embed support).
- Any change that makes `JwtAuthFilter` accept tokens from the
  `Authorization` header (would create a Bearer-token surface that
  bypasses the cookie-only assumption).
- Any relaxation of `X-Frame-Options` (e.g. moving to a permissive
  `Content-Security-Policy: frame-ancestors`) to allow embedding.

When any trigger fires, write a successor ADR proposing one of:

1. Re-enable Spring Security's CSRF filter with a
   `CookieCsrfTokenRepository` (double-submit cookie pattern, works with
   the SPA via an axios interceptor that reads the `XSRF-TOKEN` cookie
   and sets the `X-XSRF-TOKEN` header).
2. Move the access token from a cookie to an `Authorization: Bearer`
   header — eliminates ambient credentials entirely at the cost of XSS
   exposure (token must live in JS-accessible storage).

## Consequences

- **Positive:** the current code stays simple while the deployment is
  same-origin SPA only.
- **Positive:** future security review has a written reference for
  *why* CSRF is currently disabled, instead of an undocumented
  one-liner in `SecurityConfig`.
- **Negative:** an under-attention deployment that quietly adds an
  embed scenario could ship without flipping CSRF on. Mitigation:
  keep this ADR's trigger list in the security review checklist.
