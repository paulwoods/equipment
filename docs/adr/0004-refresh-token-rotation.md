# 4. Refresh-token rotation on every refresh

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

ADR-0003 establishes refresh tokens as opaque, server-stored UUIDs. The
remaining question: when `/api/v1/auth/refresh` is called, do we keep the
existing refresh token or issue a new one?

## Decision

Rotate refresh tokens on every successful refresh. `RefreshTokenService.validateAndRotate`:

1. Looks up the presented token.
2. Rejects it if expired.
3. **Deletes it** from the database.
4. Creates and persists a new UUID with a fresh 7-day expiry.
5. Returns the new token, which the controller writes back via cookie.

`/auth/logout` deletes all refresh tokens for the user.

## Consequences

- **Positive:** a stolen refresh token has a narrow window of validity — as
  soon as either the attacker or the legitimate user refreshes, the other
  party's token is invalidated.
- **Positive:** detection becomes possible in the future: if an already-used
  refresh token is presented, that's evidence of theft (the current code
  silently returns 401, but the data model supports adding a "rotated_from"
  audit trail later).
- **Negative:** every page session generates write traffic to `refresh_token`
  on each refresh. Acceptable at current scale.
- **Negative:** `validateAndRotate` deletes-then-creates inside a single
  `@Transactional` boundary. If the new insert fails after the delete, the
  user is logged out. Acceptable failure mode.
