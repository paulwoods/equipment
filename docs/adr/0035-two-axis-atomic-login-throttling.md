# 35. Login throttling counts the IP and the account independently, in one step

- **Status:** Accepted
- **Date:** 2026-08-13
- **Amends:** [ADR-0007](0007-in-process-caffeine-rate-limit.md) (login limiter only;
  the forgot-password and API limiters are unchanged)

## Context

`LoginRateLimiterService` kept one Caffeine counter keyed on the tuple
`(ip, email)`, read it with `isBlocked(...)` before authenticating, and wrote to
it with `recordFailure(...)` afterwards. A security scan (2026-07-30, findings 1
and 4) called out two independent defects, both confirmed against the code:

1. **The composite key throttles neither axis.** The counter only accumulates
   when the same IP retries the same account. An attacker on one IP walking a
   list of harvested emails gets a fresh budget per account; an attacker rotating
   source IPs against one account gets a fresh budget per IP. Neither
   credential stuffing nor distributed brute force is actually limited. The
   login path has no fallback either — `ApiRateLimitFilter` lists
   `/api/v1/auth/login` in its skip paths.
2. **Check and record are not atomic.** Between the `isBlocked` read and the
   `recordFailure` write sits a bcrypt verification, 100–400 ms wide. Concurrent
   requests all observe the same under-threshold count and pass together.

## Decision

Two counters, one keyed on the normalized IP and one on the normalized email,
and a single `tryAcquire(ip, email)` that increments both and answers whether the
attempt may proceed. Either counter exceeding `app.login-max-attempts` blocks.

The gate is the record: there is no separate `recordFailure`. A failed login
simply leaves the attempt counted; `recordSuccess` gives the attempt back.

`recordSuccess` treats the two axes differently on purpose. The account's counter
is cleared outright — the caller proved they hold the credential. The IP's counter
is only handed back the single attempt this login consumed, via a new
`WindowedCounter.release(key)`; clearing it would let an attacker with any one
valid account wipe the failures they had accumulated against every other account
from that IP.

`release` drops the key once its count reaches zero, so an IP that logs in
cleanly does not leave behind an entry whose expiry window would shorten the
lockout on a later burst of failures.

## Consequences

- **Positive:** both attack shapes in the finding are now bounded — 5 attempts per
  IP and 5 per account per 15-minute window, by default.
- **Positive:** no window between deciding and counting, so concurrency cannot
  inflate the budget.
- **Negative:** shared egress IPs (an office NAT, a household) now share one IP
  budget. Five *failed* logins across all users behind that IP within the window
  blocks the sixth attempt. Successful logins do not consume it, so ordinary use
  is unaffected; a site that hits this raises `APP_LOGIN_MAX_ATTEMPTS`.
- **Negative:** two cache entries per attempt instead of one — negligible at
  `maximumSize(10_000)` each.
- The counters remain in-process. [ADR-0026](0026-in-memory-rate-limiting.md)'s
  revisit triggers still apply, unchanged: a second replica doubles both budgets.
