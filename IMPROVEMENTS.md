# Backend Best-Practices Review — Improvements

Review date: 2026-06-09. Scope: `equipment-backend` (Spring Boot, Java 25).

Overall verdict: the backend is in better shape than most — DTOs with bean validation, hashed refresh/reset tokens, ProblemDetail error responses, rate limiting, ShedLock, Flyway, `open-in-view: false`, and documented security trade-offs (ADRs). The findings below are real deviations from best practice, but most are moderate; nothing is alarming.

## Higher-impact findings

### 1. The export endpoint serializes JPA entities directly

> **Implemented (2026-06-09):** `ExportResponse` DTOs (mirroring the import shape for round-trip compatibility) replace entity serialization; `ExportService` maps inside the read-only transaction with the same history warm-up as `DashboardService`.

`ExportService.exportAll()` (`ExportService.java:18`) returns `List<Equipment>`, and `EquipmentController.exportEquipment` (`EquipmentController.java:57-64`) feeds it straight to Jackson. Exposing entities over the API couples the export format to the persistence model, depends on `@JsonIgnore` to break the bidirectional cycle, and relies on manually force-initializing lazy collections (`p.getHistory().size()`) so serialization outside the transaction doesn't blow up. Any new field or relationship added to `Equipment` silently changes the export format. Standard practice is to map to an explicit export DTO (already done everywhere else — this is the one place entities leak out).

### 2. Token expiry and lifetimes use `LocalDateTime` instead of `Instant`

> **Implemented (2026-06-09):** `TokenEntity.expiresAt` and `User.createdAt` are now `Instant`; migration `V8__timestamptz_for_machine_timestamps.sql` converts the columns to `TIMESTAMPTZ`.

`RefreshTokenService.java:36`, `PasswordResetService.java:38`, and `User.createdAt` all use `LocalDateTime.now()`, with plain `TIMESTAMP` columns. Token validity depends on the JVM's default timezone: a container running in UTC vs. a DB assumed local, a timezone change, or a second instance in another region will shift expiry by hours. Best practice for machine timestamps is `Instant` + `TIMESTAMPTZ`; `LocalDate(Time)` is for user-facing calendar dates like `purchaseDate`.

### 3. Cookie lifetimes are hardcoded and can silently diverge from token lifetimes

> **Implemented (2026-06-09):** `app.refresh-token-days` added to `AppProperties`/`application.yml`; `CookieService` derives the access-cookie max-age from `jwt-expiration-ms` and the refresh-cookie max-age from `refresh-token-days`, which `RefreshTokenService` also uses.

`CookieService.java:23` pins the access cookie to `3600` seconds while the actual JWT lifetime is the configurable `app.jwt-expiration-ms` (default also 1h, but changeable via env). Same for the refresh cookie (`7 * 24 * 3600` at `CookieService.java:27`) duplicating `REFRESH_TOKEN_DAYS = 7` in `RefreshTokenService.java:19`. If anyone changes `APP_JWT_EXPIRATION_MS`, the cookie either outlives or kills the token. The single source of truth should be `AppProperties`.

### 4. Rate limiting is in-memory while the rest of the app is built for multi-instance

> **Implemented (2026-06-09):** documented as an explicit single-instance constraint with revisit triggers in `docs/adr/0026-in-memory-rate-limiting.md` (chose documentation over adding Redis/Postgres counters for the current single-node deploy).

ShedLock was added specifically so multiple instances can run, but `LoginRateLimiterService` and `ApiRateLimitFilter` use per-instance Caffeine caches. With N instances behind a load balancer, an attacker gets N× the attempt budget, and lockouts don't propagate. Either document single-instance as a constraint (like the CSRF ADR) or back the counters with Postgres/Redis.

### 5. No integration tests despite the scaffolding for them

> **Implemented (2026-06-09):** Testcontainers added (`testcontainers-junit-jupiter`/`-postgresql`, versions managed by the Boot BOM); `BackendApplicationIT` boots the full context against `postgres:18` and covers Flyway, the JOIN FETCH queries, import/export round-trip, and the advisory-lock setup guard. The stale `.bak` test configs were deleted. Run with `./mvnw verify`.

The failsafe plugin is configured for `**/*IT.java`, but zero IT files exist, there's no Testcontainers dependency, and `src/test/resources` contains only `application-test.properties.bak` / `application-test.yaml.bak` (disabled config checked into the repo — these should be deleted). All 29 test classes are unit/slice tests, so the Flyway migrations, the JPQL `JOIN FETCH` queries, and the native advisory-lock query are never executed against a real Postgres. That's the standard gap Testcontainers exists to close.

## Moderate findings

### 6. `AuthController` is a fat controller

> **Implemented (2026-06-10):** login/logout/refresh/forgot-password/reset-password/current-user logic moved to a new `AuthService` (unit-tested without MockMvc in `AuthServiceTest`); the controller keeps only request/response and cookie wiring and now injects 2 dependencies.

11 injected dependencies, and the login flow (rate-limit checks, timing-equalization with a dummy hash, token issuance, cookie writing) is business logic living in the web layer (`AuthController.java:50-92`). Convention is a thin controller delegating to an `AuthService`; it would also make this logic unit-testable without MockMvc.

### 7. `assert userDetails != null` in production code

> **Implemented (2026-06-10):** removed during the `AuthService` extraction; the principal cast is guaranteed by `DaoAuthenticationProvider`.

`AuthController.java:77`. Java assertions are disabled at runtime unless `-ea` is passed, so this line does nothing in production. Use `Objects.requireNonNull` or remove it.

### 8. `EmailService` is `@Transactional` at the class level

> **Implemented (2026-06-10):** annotation removed with a comment explaining why; `DashboardService` already runs its reads in its own `@Transactional(readOnly = true)`.

`EmailService.java:19` — sending SMTP mail inside a database transaction holds a connection from the Hikari pool for the duration of slow external network I/O. `sendPasswordResetEmail` doesn't touch the DB at all. Transactions should not span external I/O; drop the annotation here and keep the read in `DashboardService` (which already has its own `@Transactional(readOnly = true)`).

### 9. `JwtAuthFilter` parses the JWT three times and queries the user twice per request

> **Implemented (2026-06-10):** the three `JwtService` extractors were replaced by a single `validate(token)` returning `Optional<ValidToken>` (one parse), and the filter loads the user entity once, building `UserDetails` from it via `UserDetailsServiceImpl.toUserDetails` instead of a second `findByEmail`.

`isTokenValid`, `extractEmail`, and `extractTokenVersion` each call `parseClaims` (`JwtService.java:37-56`), then the filter does `userRepository.findByEmail` followed by `userDetailsService.loadUserByUsername`, which runs the same query again (`JwtAuthFilter.java:48-59`). Parse the claims once and load the user once — on the hottest path in the app this is pure waste.

### 10. Security matcher chain ends with `anyRequest().permitAll()`

> **Implemented (2026-06-10):** chain now ends with `anyRequest().denyAll()` (the backend serves no static content), with the ERROR dispatch explicitly permitted so filter-level failures still reach `/error`.

`SecurityConfig.java:61` — the in-code comment admits the ordering is fragile (moving the swagger rule would expose docs). Best practice is deny-by-default: enumerate the static/SPA paths explicitly and end with `anyRequest().denyAll()` (or `authenticated()`), so a future mis-ordered rule fails closed instead of open.

### 11. `GET /api/v1/auth/me` returns `200` with an empty body for anonymous users

> **Implemented (2026-06-10):** `/auth/me` was removed from the `permitAll` list (now under `/api/v1/**` → authenticated) and the controller throws `401` defensively; the frontend `getMe()` treats `401` as "not logged in" (its callers already handled the rejection path).

`AuthController.java:166-168` — an unauthenticated request to a "who am I" endpoint should be `401`. A 200-with-nothing forces the client to special-case an empty body and breaks normal HTTP semantics.

### 12. `ImportService` duplicates validation by hand

> **Implemented (2026-06-10):** the import DTOs now carry full constraints (`@NotNull purchaseDate`, `@NotNull @Min(1) intervalDays`, `@NotNull date`, cascading `@Valid` on nested lists) and `ImportService` runs the injected `jakarta.validation.Validator`, collecting every violation across the payload into one `ImportEquipmentException` (messages like `Equipment[2].procedures[0].name: must not be blank`).

`ImportService.java:76-106` — the manual null/blank loop re-implements what `@NotBlank`/`@NotNull`/`@Min(1)` on `ImportRequest.EquipmentImport` plus a `Validator` would do, and it stops at the first error, so a user fixing a 500-row import gets errors one at a time. Annotate the import DTOs and collect all violations in one response.

### 13. Entity mappings are looser than the schema

> **Implemented (2026-06-10):** `@Column(nullable = false)` added to match the schema (`Equipment.manufacturer/modelNumber/status` with `length = 50` on status, `Procedure.name/intervalDays`, `Perform.date`); the unused `@AllArgsConstructor` was removed from `Equipment`, `Procedure`, and `Perform`.

`Equipment.manufacturer`, `modelNumber`, and `status` are `NOT NULL` in `V1__create_schema.sql` but have no `@Column(nullable = false)` in `Equipment.java:22-29`, and there's no length metadata. `ddl-auto: validate` won't catch nullability drift, so the entity model lies about the contract. Also, the `@AllArgsConstructor` on `Equipment`/`Procedure` generates a positional constructor of mostly `String` args that excludes the inherited `id` — error-prone and apparently unused; prefer removing it.

### 14. No optimistic locking

> **Implemented (2026-06-10):** `@Version` added to `Equipment`, `Procedure`, and `User` (migration `V9__add_version_columns.sql`), and `GlobalExceptionHandler` maps `OptimisticLockingFailureException` to `409`. Note: the version is not yet round-tripped through the request/response DTOs, so stale web edits that read-then-write in separate transactions are still last-write-wins; exposing `version` in the API is the follow-up if that matters.

No entity carries `@Version`, so two users editing the same equipment record is a silent last-write-wins. For a CRUD app with concurrent editors, a `@Version` column plus handling `ObjectOptimisticLockingFailureException` as `409` is the standard pattern.

## Minor nits

> **Implemented (2026-06-10):** all addressed except the EAGER fetch, which is now deliberate. Dummy hash is generated at startup in `AuthService` via `passwordEncoder.encode(<random UUID>)`; export filename uses `yyyyMMdd-HHmmss`; the advisory-lock key is bound as a parameter; `updateRoles` uses only the orphan-removal collection (with a flush between clear and re-add, since Hibernate orders inserts before deletes and would otherwise hit the `(user_id, role_id)` unique constraint); `spring.mail.host/port` and `app.smtp-from` use `${VAR:default}` placeholders. `User.userRoles` stays EAGER: the JWT filter reads roles outside any transaction, and with finding 9 fixed the join now runs once per request.

- **`DUMMY_BCRYPT_HASH`** (`AuthController.java:48`): a hardcoded hash can drift from the encoder's cost factor (a `$2a$10$` literal vs. an encoder later bumped to strength 12 re-opens the timing oracle). Generating it at startup with `passwordEncoder.encode(<random>)` keeps them in sync automatically.
- **Export filename contains colons** (`EquipmentController.java:62`): `ISO_LOCAL_DATE_TIME` produces `2026-06-09T07:30:15`, and `:` is illegal in Windows filenames. Use a colon-free pattern like `yyyyMMdd-HHmmss`.
- **Advisory-lock SQL built by string concatenation** (`UserService.java:44`): the key is a constant so it's not injectable, but binding it as a parameter (`SELECT pg_advisory_xact_lock(?1)`) is the habit worth keeping.
- **`updateRoles` mixes orphan-removal with a direct repository delete** (`UserService.java:196-200`): `clear()` + `deleteByUserId` do overlapping work through two different mechanisms; pick one (the collection with `orphanRemoval` suffices) to avoid flush-ordering surprises.
- **Environment-specific values baked into `application.yml`**: `smtp-from: no-reply@dev.local` and `host: smtp.gmail.com` are dev/prod-specific defaults in the shared config. They're overridable via relaxed binding, but profile-specific files or explicit `${VAR:default}` placeholders would make that intent visible.
- **`User.userRoles` is `FetchType.EAGER`** (`User.java:35`): defensible for a tiny role set, but combined with finding 9 it means the roles join runs twice per request.

## Suggested starting points

Highest-value fixes first: cookie/token lifetime unification (#3), the `JwtAuthFilter` double-query (#9), and the `Instant` migration (#2).

---

**Status (2026-06-10): all findings implemented** (with #14 noting a follow-up on DTO version round-tripping and the EAGER-fetch nit kept deliberately).
