# 32. Auth endpoints do not reveal whether an account exists

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03 (hardened 2026-06-09, security review)
- **Related:** ADR-0003 (JWT cookie auth), ADR-0007 / ADR-0026 (rate limiting)

## Context

Login and forgot-password endpoints are the two places an anonymous
caller can probe for valid account emails. Two classic leaks:

1. **Response contents** — "no such user" vs "wrong password", or a
   forgot-password error for unknown emails.
2. **Response timing** — a login attempt against a real account costs
   a bcrypt verification (~100 ms by design); an attempt against a
   missing account that skips the hash returns measurably faster,
   telling the attacker which emails exist regardless of what the
   response body says.

The 2026-06-09 security review hardened both:

- `AuthService` encodes a **dummy bcrypt hash at startup**
  (`passwordEncoder.encode(UUID.randomUUID().toString())` — encoded at
  runtime so it always matches the encoder's current cost factor).
  When login hits an unknown email, it runs
  `passwordEncoder.matches(...)` against the dummy hash before
  returning the same `401 "Invalid credentials"` the wrong-password
  path returns.
- `forgotPassword` is fire-and-forget: unknown emails take the
  `ifPresent` no-op branch and the endpoint responds identically
  whether or not a reset email was sent. Enumeration by reset-request
  is left with only the rate limiter (per-IP) to answer to.

## Decision

Treat account existence as a secret on unauthenticated endpoints:
identical response bodies, status codes, *and* computational cost for
the exists / doesn't-exist paths. Any new unauthenticated endpoint
that touches user lookup inherits this requirement.

## Consequences

- **Positive:** email enumeration via the API requires either a
  side-channel subtler than body/status/timing or abuse volumes the
  rate limiter (ADR-0026) is there to blunt.
- **Negative:** every failed login against a nonexistent account now
  pays a full bcrypt verification — deliberate, and it means login
  throughput under attack is bounded by bcrypt cost either way.
- **Negative:** forgot-password swallows failures silently, including
  *real* delivery failures for legitimate users ("I never got the
  email" is indistinguishable from "typoed my address"). Accepted as
  the standard trade for this pattern.
- **Constraint:** the dummy-hash trick only equalizes timing while the
  real path does exactly one `matches()` call. Adding per-user work to
  the login path (e.g. per-user lockout lookups after the hash check)
  must be mirrored on the unknown-user path or the timing signal
  returns.
