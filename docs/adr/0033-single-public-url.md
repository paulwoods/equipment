# 33. One `app-url` property for every user-facing link

- **Status:** Accepted
- **Date:** 2026-07-18
- **Related:** ADR-0003 (JWT cookie auth)

## Context

Emailed links were built from two separate properties:

- `app.app-url` (`APP_URL`) — used by the dashboard email.
- `app.frontend-url` (`APP_FRONTEND_URL`) — used by the password-reset
  email, via an `AppProperties.getFrontendUrl()` accessor that fell
  back to `appUrl` when `frontendUrl` was blank.

The fallback never fired. `application.yml` declared
`frontend-url: ${APP_FRONTEND_URL:http://localhost:5173}`, so the field
was always non-blank, and `APP_FRONTEND_URL` was set in neither
`deployment/.env` nor `.env.example`. Production password-reset emails
therefore linked to `http://localhost:5173/reset-password?token=…` —
every reset link sent from production was dead, and had been since the
property was introduced.

The bug was invisible for three compounding reasons: the dead fallback
branch read as if it handled the unset case, the failure surfaced only
in an email nobody on the team receives, and `EmailServiceTest` stubbed
the URL property without ever asserting what the link contained.

The split also encoded a distinction that does not exist in this
deployment. Caddy terminates TLS on a single hostname and routes
`/api/*` to the backend and everything else to the frontend, and the
SPA calls the API with `baseURL: ''` — relative. Frontend and API are
necessarily same-origin, so there is no production configuration in
which the two values legitimately differ.

## Decision

Collapse the two into one property, `app.app-url`, meaning **the public
URL a user visits**. Every user-facing link we email is built from it.
`frontend-url`, `APP_FRONTEND_URL`, and `getFrontendUrl()` are removed;
the local-dev default becomes `http://localhost:5173` (the SPA's origin,
which is what the removed property defaulted to), not the backend port.

In production `APP_URL` must match `CADDY_DOMAIN`. They are separate
variables because Caddy cannot read Spring's config and vice versa, but
they describe one hostname.

## Consequences

- **Positive:** one variable to change when the domain moves. The
  subdomain migration to `equipment.mrpaulwoods.com` touches `APP_URL`,
  `CADDY_DOMAIN`, and `CADDY_APEX_DOMAIN` — nothing in application code.
- **Positive:** the failure mode is now loud. An unset `APP_URL` yields
  a localhost link in *both* emails rather than one, and
  `EmailServiceTest.sendPasswordResetEmail_linksToAppUrl` asserts the
  reset link's full URL, so a regression fails the build.
- **Negative:** e2e must now set `APP_URL` to the frontend port (5174)
  rather than the backend port (8081), since the two ports genuinely
  differ there and the property means "where the user goes". This
  incidentally corrects e2e dashboard emails, which previously linked to
  the backend.
- **Constraint:** this rests on frontend and API being same-origin. If
  the SPA is ever served from a different origin than the API — a CDN,
  a separate static host — the two values diverge again and the
  property must be re-split rather than overloaded. That change would
  also make `APP_CORS_ALLOWED_ORIGINS` load-bearing, which it currently
  is not.
