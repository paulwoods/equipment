# 30. Refresh and password-reset tokens are stored as SHA-256 hashes

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03 (decision made 2026-06-09, security-review hardening)
- **Related:** ADR-0004 (refresh-token rotation), ADR-0029 (token-version revocation)

## Context

Refresh tokens (`refresh_token` table) and password-reset tokens
(`password_reset_token` table) were originally stored as the raw
opaque values sent to the client. Anyone with read access to the
database — a backup, a leaked dump, an over-privileged reporting
query — could lift a live refresh token and mint access tokens for any
user, bypassing the password entirely. Reset tokens carried the same
risk for account takeover.

`V7__hash_tokens.sql` (part of the 2026-06-09 security-review
hardening) converts both tables to store digests. `TokenHasher`
computes a SHA-256 of the raw token; `RefreshTokenService` and
`PasswordResetService` hash the presented value and look up the digest.
Existing raw-token rows were invalidated by the migration rather than
converted (the raw values are unrecoverable from the server side by
design).

SHA-256 rather than bcrypt is deliberate: bcrypt's cost factor exists
to slow brute force of *low-entropy* secrets (passwords). These tokens
are generated from `UUID.randomUUID()`-class entropy, so offline brute
force is already infeasible; a fast hash gives the at-rest protection
without adding ~100 ms to every token validation on the hot refresh
path.

## Decision

Never persist a raw authentication token. Store the SHA-256
digest, hash the client-presented value on lookup, and keep the raw
value's only existence in the HttpOnly cookie / reset email.

## Consequences

- **Positive:** a database leak no longer yields usable session or
  reset tokens; the digest is one-way for high-entropy input.
- **Positive:** validation stays O(µs) — no bcrypt tax on the refresh
  endpoint that fires on every session renewal.
- **Negative:** tokens are unrecoverable server-side. Support cannot
  "look up someone's reset link"; the only remedy is issuing a new
  token. (This is a feature dressed as a limitation.)
- **Constraint:** the scheme is only sound while token generation
  stays high-entropy. If anyone ever "simplifies" token generation to
  something guessable, SHA-256 stops being sufficient — the entropy
  source and the fast hash are a package deal.
