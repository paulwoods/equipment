# 29. JWT revocation via a per-user token-version claim

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03 (decision made 2026-05-12, "invalidate sessions on credential changes")
- **Related:** ADR-0003 (JWT cookie auth), ADR-0004 (refresh-token rotation), ADR-0008 (stateless server)

## Context

ADR-0003's JWTs are self-contained: once issued, a signed access token
is valid until expiry, and nothing server-side can retract it. That is
the classic JWT revocation problem — a password change, an admin
disabling an account, or a logout should kill existing sessions, but a
purely stateless check can't know the token was invalidated.

`V5__user_token_version.sql` adds `users.token_version BIGINT`, and:

- `JwtService.generateToken` embeds the user's current version as a
  `tv` claim.
- `JwtAuthFilter` loads the user by email on every authenticated
  request and rejects the token unless `tv` equals the user's current
  `token_version`. Tokens predating the claim (`tv` absent) are
  rejected too.
- `AuthService.logout` and credential changes call
  `bumpTokenVersion`, instantly orphaning every outstanding access
  token for that user.

The obvious alternative — a token denylist — needs a store keyed by
token ID with TTL management; the version counter gets the same effect
with one integer column.

## Decision

Revoke access tokens by versioning them: bump
`users.token_version` on logout and credential changes, and reject any
JWT whose `tv` claim doesn't match the current value.

## Consequences

- **Positive:** revocation is instant and total per user — logout on
  one device kills all devices' access tokens, matching the
  refresh-token deletion in `AuthService.logout`.
- **Positive:** one `BIGINT` column instead of denylist
  infrastructure; no TTL bookkeeping.
- **Negative:** the server is no longer stateless in the ADR-0008
  sense for authentication — **every authenticated request costs a
  user lookup by email**. The JWT signature check alone no longer
  authenticates; the DB round-trip is the real gate. If request volume
  ever makes this hot, a short-TTL user cache reintroduces (bounded)
  revocation latency as the trade.
- **Negative:** revocation granularity is all-or-nothing per user —
  there is no "log out that one device" without logging out all.
