# 13. Axios client with `withCredentials` for cookie auth

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

Auth tokens are HttpOnly cookies (ADR-0003). For the browser to attach them
to API requests, the HTTP client must opt in to credentials, and CORS must
allow them on the server side.

## Decision

- Single shared axios instance in `frontend/src/lib/apiClient.ts`:

  ```ts
  axios.create({
      baseURL: '',
      timeout: 10_000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
  })
  ```

- All API calls go through `frontend/src/api/client.ts`, which wraps every
  endpoint in a typed function. Components never call `axios` directly.
- `baseURL: ''` keeps requests relative — in dev they're proxied by Vite,
  in prod they're routed by Caddy under the same origin.
- The Spring `WebConfig.addCorsMappings` allows the configured origins
  with `allowCredentials(true)` and methods `GET, POST, PUT, PATCH, DELETE,
  OPTIONS`, max-age 3600.

## Consequences

- **Positive:** auth is invisible to the call site — every endpoint
  function "just works" once the user is logged in.
- **Positive:** the centralized client is the single place to add
  interceptors (e.g. auto-refresh on 401, telemetry).
- **Negative:** cookies are attached to every request including ones that
  don't need them. Not a leak — they're going to first-party origins
  only.
- **Negative:** `allowCredentials(true)` requires explicit origins; you
  can't use `*`. The `APP_CORS_ALLOWED_ORIGINS` env var must include every
  domain the SPA is served from.
