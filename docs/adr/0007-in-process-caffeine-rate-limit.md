# 7. In-process Caffeine rate limiting per-IP

- **Status:** Accepted (reverse-engineered)
- **Amended by:** [ADR-0035](0035-two-axis-atomic-login-throttling.md) — the login limiter is now two independent counters
- **Date:** 2026-05-06

## Context

The application is internet-facing (Caddy + Let's Encrypt) and exposes
authentication, password reset, and CRUD endpoints. It needs basic abuse
protection against credential stuffing and request flooding without
introducing external infrastructure (Redis, a dedicated rate-limiting
service).

The deployment is a single backend container behind Caddy — we don't have
to coordinate counters across replicas.

## Decision

Three layered, in-process rate limiters using
[Caffeine](https://github.com/ben-manes/caffeine) caches with TTL eviction:

| Limiter                            | Scope                  | Default                                  |
|------------------------------------|------------------------|------------------------------------------|
| `LoginRateLimiterService`          | per IP + email         | 5 failures / 15 min lockout              |
| `ForgotPasswordRateLimiterService` | per IP                 | 3 requests / 1 hour                      |
| `ApiRateLimitFilter` (servlet)     | per IP, all `/api/v1/*` except auth/setup/version/test | 100 req/min |

All thresholds are externalized to `AppProperties` (`APP_LOGIN_MAX_ATTEMPTS`,
`APP_API_RATE_LIMIT_MAX_REQUESTS`, etc.) so deployments can tune without
recompiling. The servlet filter is wired at
`Ordered.HIGHEST_PRECEDENCE + 10` to run before authentication.

Login and forgot-password are intentionally **excluded** from the global
filter — they have their own narrower limiters that distinguish success
from failure.

## Consequences

- **Positive:** zero external dependencies; survives backend restarts only
  by losing counters (which is generally acceptable — counters self-heal).
- **Positive:** `Caffeine` is high-throughput and thread-safe; cap of
  `maximumSize=10_000` per cache prevents unbounded growth from
  scattered IPs.
- **Negative:** counters are per-instance — if the deployment ever scales to
  multiple replicas, each gets its own bucket and the effective limit
  multiplies. Replace with Redis-backed limiter (e.g. Bucket4j) at that
  point.
- **Negative:** behind Caddy, `request.getRemoteAddr()` returns the proxy
  address unless `forward-headers-strategy: native` (set in
  `application.yml`) and Caddy forwards `X-Forwarded-For`. Verify in any
  new deployment topology.
