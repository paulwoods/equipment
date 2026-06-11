# 26. Rate limiting is in-memory and assumes a single backend instance

- **Status:** Accepted
- **Date:** 2026-06-09
- **Related:** ADR-0018 (CSRF posture)

## Context

The backend enforces three rate limits, all backed by per-process
Caffeine caches:

1. **Login throttling** — `LoginRateLimiterService` counts failed
   attempts per (IP, email) pair and blocks after
   `app.login-max-attempts` failures for
   `app.login-lockout-duration-ms`.
2. **Forgot-password throttling** — `ForgotPasswordRateLimiterService`
   limits reset requests per IP within a sliding window.
3. **General API throttling** — `ApiRateLimitFilter` caps requests per
   IP per window across `/api/v1/**`.

Because the counters live in process memory, each backend instance
keeps its own. The codebase elsewhere prepares for multi-instance
operation (ShedLock guards the weekly dashboard email scheduler), so
the inconsistency deserves an explicit decision: with N instances
behind a load balancer, an attacker effectively gets N times the
attempt budget, and a lockout on one instance does not propagate to
the others. Counters also reset on every deploy/restart.

Distributed alternatives exist — counters in Postgres (a write per
request on the hot path) or an added Redis/Valkey dependency — but
both carry real cost: per-request DB writes for the API filter, or a
new piece of infrastructure to operate, secure, and monitor.

## Decision

Keep the rate-limit counters in process memory and document
**single-instance deployment as an explicit operational constraint**
for the security guarantees of rate limiting.

The current deploy model (one backend container via
`docker compose up -d`) satisfies the constraint, so the in-memory
implementation is exact today. ShedLock remains in place because the
cost of a duplicate weekly email on a future scale-out is silent and
user-visible, whereas the rate-limit assumption is recorded here and
checked at the moment someone decides to scale.

## Revisit triggers

Move the counters to shared storage (Postgres for the low-volume
login/forgot-password limits; Redis/Valkey if the general API limit
must also be distributed) **before** any of the following:

- Running more than one backend replica behind a load balancer.
- Moving to an orchestrator that performs rolling restarts with
  overlapping instances (brief 2x budget during each deploy).
- Relying on the lockout duration as a compliance control rather
  than a best-effort brake.

## Consequences

- **Positive:** zero added infrastructure and zero per-request
  database writes; the hot-path API filter stays allocation-cheap.
- **Positive:** the limits fail soft — a restart clears counters but
  never locks legitimate users out spuriously.
- **Negative:** the protection weakens linearly with instance count
  if the constraint above is ignored; nothing in the code enforces
  it. The mitigation is this ADR plus the revisit triggers.
- **Negative:** counters do not survive restarts, so an attacker who
  can time requests around deploys gets a fresh budget. Acceptable:
  login throttling is one of several layers (bcrypt cost, token
  versioning, anti-enumeration timing equalization).
