# 8. Stateless server with `SessionCreationPolicy.STATELESS`

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

Once authentication moved to JWT cookies (ADR-0003), the only thing
HTTP sessions would do is hold the `SecurityContext` between requests —
duplicating what the JWT already conveys.

## Decision

`SecurityConfig.filterChain`:

- `sessionManagement().sessionCreationPolicy(STATELESS)` — Spring Security
  will not create or use `HttpSession`.
- `csrf().disable()` — there is no session to forge against; the SameSite
  cookie + CORS allow-list cover the cookie-based attack vectors (see
  ADR-0003 caveat).
- `JwtAuthFilter` runs before `UsernamePasswordAuthenticationFilter` and
  populates `SecurityContextHolder` per-request from the cookie.

Additional hardening on the same filter chain:

- HSTS with 1-year max-age and `includeSubDomains`.
- `X-Frame-Options: DENY` (clickjacking).
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: no-referrer`.

## Consequences

- **Positive:** no `JSESSIONID`, no session fixation, no session-replication
  concerns if the backend is later horizontally scaled.
- **Positive:** every request is independently authorized — easy to reason
  about.
- **Negative:** features that genuinely want server-side session state
  (multi-step wizards holding partial data, server-side flash messages) need
  to be re-thought as transactions or client-state.
