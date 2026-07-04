# Domain glossary

Shared vocabulary for the equipment project. Names here are load-bearing — use
them exactly in code and discussion. Architecture terms (module, interface,
seam, depth) come from the `/codebase-design` skill; this file names the
*domain* concepts.

## Rate limiting

**WindowedCounter&lt;K&gt;** — the deep module behind all rate limiting. Caches a
per-key count that expires a fixed window after the key's *first* increment
(Caffeine `expireAfterWrite`; in-place increments mutate the count and do not
push the expiry out). Small interface — `count(key)`, `increment(key)` (returns
the new count), `reset(key)` — hiding the cache mechanics. Generic in the key
type so callers own their key (see **LoginKey**). Constructed via
**WindowedCounterFactory**, which injects the `Ticker` (system in prod, a fake
in tests); the counter also keeps a public constructor so its own unit tests
build it directly with a controlled `Ticker`. Lives in the `ratelimit` package.

**Rate-limit policy** — the per-caller rules layered *on top of* a
WindowedCounter, kept in each limiter rather than the counter:
- **Login** (`LoginRateLimiterService`, key = **LoginKey**): counts failures
  only, resets on success, blocks when `count(key) >= max`.
- **Forgot-password** (`ForgotPasswordRateLimiterService`, key = ip): counts
  every request, blocks when `count(key) >= max`.
- **API** (`ApiRateLimitFilter`, key = ip): atomic increment-then-check, blocks
  when `increment(key) > max`. The `>` vs `>=` difference is not a discrepancy —
  both mean "N allowed, block on N+1"; the operator follows check-before-record
  vs increment-then-check.

**LoginKey** — composite rate-limit key `(ip, email)` with normalization
(lowercased email, nulls → empty). Login-specific; stays in the login limiter,
not the counter.
