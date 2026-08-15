# Tasks

## ⬜ TODO — Land the 2026-07-30 security remediation on the droplet

The five scan findings were fixed in code and pushed on 2026-08-14 (backend
`9656af4` 2.0.48, frontend `f30aa91` 2.0.41, parent `30a2136`; ADR-0035,
ADR-0036). **None of it is running in production yet.** Everything below is a
manual step on the vm — CI publishes images but does not deploy (ADR-0025).

Do 1 and 2 in the same visit: the deploy restarts the stack anyway, and the
compose edit needs a container recreate to take effect.

1. **Deploy 2.0.48 / 2.0.41** — until this runs, the login-limiter and
   setup-token fixes are not live.

       ssh <droplet>
       cd ~/caddy && ~/…/equipment/deployment/deploy.sh 2.0.48 2.0.41

   → verify: `docker compose ps` shows both services healthy on the new tags,
   and the login page still signs in.

2. **Mirror the Postgres port removal into `~/caddy/docker-compose.yml`** —
   finding 5. The repo copy (`deployment/docker-compose.yml`) is a sanitized
   reference; the live file is on the vm and still publishes the port. Delete
   the `ports:` stanza from the `postgres` service:

       ports:
         - "127.0.0.1:5432:5432"

   → verify: `ss -ltnp | grep 5432` on the vm returns nothing, and
   `docker compose exec postgres psql -U postgres -d equipment -c '\dt'` still
   works (that is the supported operator path now — `backup.sh` and `sql.sh`
   already go through `docker exec`, so neither breaks).

3. **Add `APP_SETUP_TOKEN` to the deployed `.env`** — finding 2. No effect on
   the running instance, whose setup is long complete; it matters only if the
   stack is ever rebuilt from an empty database, where first-run setup now
   answers 503 without it. Generate with `openssl rand -base64 24`. See
   `deployment/.env.example` and ADR-0036.

   → verify: `grep APP_SETUP_TOKEN ~/caddy/.env` on the vm.

4. **Install the Playwright browsers** so the e2e suite can run locally —
   unrelated to the security work, pre-existing. `npx playwright install` in
   `equipment-e2e` (`chromium_headless_shell-1217` is what is missing). The
   suite is currently unverifiable end-to-end: `global-setup.ts` seeds fine
   against a real backend, but every browser-driven spec fails at launch.

   → verify: `cd equipment-e2e && npm run e2e` goes green.

### Not scheduled

- `security-remediation/` and `security-scan/` are untracked in the parent repo.
  Decide whether the scan output belongs in git or in `.gitignore`.
- Findings 5–21 of the same scan were never triaged — 5 more HIGHs (shared-bucket
  API limiter, CI mutable action tags exposing `DOCKERHUB_TOKEN` ×2, image tags
  pulled by tag, SMTP STARTTLS enabled but not required), 9 MEDIUMs, 2 LOWs.

## ✅ DONE — Rate limiting: extract `WindowedCounter` deep module

Implemented 2026-07-03. All 278 backend tests pass. New `ratelimit` package holds
`WindowedCounter`, `WindowedCounterFactory`, `RateLimitConfig` (Ticker bean), and
the two moved limiter services; `ApiRateLimitFilter` injects the factory.

**Semantics correction found during implementation:** the window is anchored at a
key's *first* increment, not extended by later ones — `computeIfAbsent(...)
.incrementAndGet()` mutates the `AtomicInteger` in place, which Caffeine's
`expireAfterWrite` doesn't see. This matches the original code exactly (behavior
preserved), but contradicted my initial "restarts on each write" assumption. Doc
comments, `CONTEXT.md`, and the counter test were corrected to reflect it.

---

### Original notes (design, for reference)

Collapse the three duplicated Caffeine counter caches into one deep module.
Design settled via grilling session (2026-07-03). No behavior change intended —
this is a pure deepening refactor. See `CONTEXT.md` for the domain terms.

### Design decisions (locked)

- **Interface**: low-level windowed counter, not `tryConsume`. `tryConsume`
  can't express Login (counts failures only, resets on success, separates check
  from record).
- **Instantiation**: `WindowedCounterFactory` (`@Component`), each limiter
  injects it and calls `create(window)`. Not a shared singleton — each window
  differs.
- **Time seam**: factory holds an injected `Ticker`; `WindowedCounter` also
  keeps a public constructor so its own unit tests build it directly with a fake
  `Ticker`.
- **Key typing**: generic `WindowedCounter<K>`; callers own their key type.
- **Naming**: `WindowedCounter` / `WindowedCounterFactory`.
- **Placement**: new `ratelimit` package holds the counter, factory, and the two
  moved limiter services. `ApiRateLimitFilter` stays in `filter`, injects factory.

### Target interface

```java
// ratelimit package, plain final class
class WindowedCounter<K> {
    int  count(K key);       // read (getIfPresent); does NOT extend window
    int  increment(K key);   // write; returns new count; extends window
    void reset(K key);       // invalidate(key)
}
```

Hides: `Caffeine.newBuilder()`, `expireAfterWrite`, `AtomicInteger`,
`computeIfAbsent`, `maximumSize(10_000)`. Public ctor:
`WindowedCounter(Duration window, Ticker ticker)`.

```java
@Component
class WindowedCounterFactory {
    private final Ticker ticker;                 // injected
    WindowedCounterFactory(Ticker ticker) { ... }
    <K> WindowedCounter<K> create(Duration window) {
        return new WindowedCounter<>(window, ticker);
    }
}
```

### Implementation steps

1. **Add `@Bean Ticker systemTicker()`** — in a config class (e.g. alongside
   `AppProperties` config or a new bean method). Prod uses
   `Ticker.systemTicker()`; tests inject a fake.
   → verify: context loads; `WindowedCounterFactory` gets the bean.
2. **Create `ratelimit/WindowedCounter.java`** — generic, public
   `(Duration, Ticker)` ctor. `count` = `getIfPresent` read (null → 0);
   `increment` = `computeIfAbsent(...).incrementAndGet()`; `reset` =
   `invalidate`. `maximumSize(10_000)` constant.
   → verify: new unit test drives window expiry, reset, increment-returns-count
   with a fake `Ticker`.
3. **Create `ratelimit/WindowedCounterFactory.java`** — `@Component`, generic
   `create(Duration)`.
4. **Move `LoginRateLimiterService` → `ratelimit`** — inject factory; keep its
   `LoginKey(ip,email)` record + normalization (lowercase email, nulls → empty)
   as Login policy. Counter is `WindowedCounter<LoginKey>`. Keep `isBlocked`
   (`count(key) >= max`), `recordFailure` (`increment`), `recordSuccess`
   (`reset`). Drop the package-private `Ticker` ctor (time now lives in factory).
   → verify: existing `LoginRateLimiterService` tests still pass (adjust to
   inject a factory backed by a fake `Ticker`).
5. **Move `ForgotPasswordRateLimiterService` → `ratelimit`** —
   `WindowedCounter<String>`. `isBlocked` (`count(ip) >= max`), `recordRequest`
   (`increment(ip)`).
   → verify: existing forgot-password limiter tests pass.
6. **Rewire `ApiRateLimitFilter`** (stays in `filter`) — inject factory,
   `create(Duration.ofMillis(apiRateLimitWindowMs))`. Replace inline Caffeine
   with `if (counter.increment(clientIp) > max) { ...429... }`. Keep atomic
   increment-then-check (`>` operator preserved).
   → verify: filter now has a time seam — add/extend a test using a fake
   `Ticker` via the injected factory.
7. **Update imports in `AuthService`** for the moved limiter classes.
   → verify: compiles.
8. **Run backend tests**: `cd equipment-backend && ./mvnw test`.
   → verify: all green.

### Guardrails / non-goals

- No behavior change. `>` vs `>=` is NOT a discrepancy — both mean "N allowed,
  block on N+1"; the operator follows check-before-record (Login/Forgot, `>=`)
  vs atomic increment-then-check (API, `>`). Do not normalize.
- Keep Login's check-then-increment racy-by-design behavior as-is.
- Don't touch `AppProperties` config field names/defaults.
- Backend change → run backend unit tests after (project rule).
