# Tasks

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
