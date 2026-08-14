# 34. Google sign-in verifies an ID token rather than running an OAuth redirect

- **Status:** Accepted
- **Date:** 2026-08-13
- **Related:** ADR-0003 (JWT cookie auth), ADR-0029 (token-version revocation), ADR-0032 (auth anti-enumeration)

## Context

Email/password was the only way in. Adding Google sign-in offered two
shapes:

1. **Spring Security `oauth2Login`** — the browser is redirected to
   `/oauth2/authorization/google`, Google redirects back to
   `/login/oauth2/code/google`, and a success handler mints our
   cookies. The authorization request's `state` and `nonce` have to
   live somewhere between the two hops, which in practice means an
   HTTP session. `SecurityConfig` runs `SessionCreationPolicy.STATELESS`
   precisely so the backend holds no per-user server state, and the
   redirect URI would additionally have to be threaded through Caddy
   and registered per environment.
2. **Google Identity Services ID token** — the login page renders
   Google's button, which returns a signed ID token in the browser.
   The SPA posts it to `POST /api/v1/auth/google`; the backend
   verifies it and issues the same cookies a password login issues.

## Decision

Take the ID token route.

`GoogleIdTokenConfig` builds a `NimbusJwtDecoder` over Google's JWK Set
(`https://www.googleapis.com/oauth2/v3/certs`), so key rotation needs no
redeployment, and layers three checks on top of signature and expiry:

- `iss` is one of `https://accounts.google.com` / `accounts.google.com`
  — Google issues both spellings. Read as a raw claim, because
  `Jwt#getIssuer` coerces to a `URL` and throws on the bare form.
- `aud` equals our own `app.google-client-id`. Without this, a genuine
  Google token minted for *any other application* would be accepted.
- `email_verified` is true. An unverified address could belong to
  anyone, so honouring it would let a Google account claim — or create
  — an account for a mailbox it does not own.

`GoogleAuthService` then resolves the account by `google_sub` first and
email second, so a Google-side email change does not strand an account,
and refuses to re-point an email that is already linked to a different
Google subject.

Sign-in is off unless `APP_GOOGLE_CLIENT_ID` is set. `GET
/api/v1/auth/google/config` reports that state to the login page, which
renders the button only when the server says so — the client ID is
public by design, since the browser hands it to Google anyway. Serving
it from the API rather than baking it into the bundle means a
deployment can turn Google sign-in on without a frontend rebuild.

**Provisioning is open:** an unrecognized verified Google email creates
a new account with the `USER` role. The one exception is first-run —
provisioning is refused while `AdminBootstrap.isSetupRequired()`, so
the system can never end up with users but no administrator, and a
passer-by cannot take the first account.

## Consequences

- **Positive:** `SessionCreationPolicy.STATELESS` survives intact. No
  session store, no redirect URIs to register per environment, no new
  authentication filter — the endpoint is an ordinary `POST` and
  everything downstream (JWT filter, refresh rotation, logout,
  token-version revocation) is unchanged.
- **Positive:** Google-provisioned accounts get no password hash at
  all, so there is no weak-secret path into them. `AuthService.login`
  rejects a null-password account down the same branch as an unknown
  user, preserving ADR-0032.
- **Negative:** the login page depends on a third-party script from
  `accounts.google.com`, which the frontend CSP now has to allow
  (script, frame, connect, style — each scoped to the documented
  `/gsi/` path). If the script is blocked, the button silently does not
  render and password login carries on.
- **Negative / open:** with open provisioning and no domain
  restriction, anyone holding any Google account can self-provision a
  `USER` account. The levers if that becomes unwanted are an `hd`
  (Workspace domain) claim check or an invite/allow-list; both are
  additive to `GoogleAuthService`.
- **Constraint:** the `aud` check is the whole of the "is this token
  for us" guarantee. Any future support for a second client ID
  (a mobile app, say) must extend that validator rather than relax it.
