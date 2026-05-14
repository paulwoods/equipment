# Backend Security & Bug Tasks

## Critical

- [x] **1. Invalidate sessions on credential changes**
  - On logout (`AuthController.java:90`), password reset (`PasswordResetService.java:42`), and password change (`UserService.java:125`), delete refresh tokens for the user and invalidate existing access JWTs.
  - Add a per-user `tokenVersion` claim checked in `JwtAuthFilter`, bumped on every credential change.

- [x] **2. Harden the setup endpoint**
  - `/api/v1/setup/**` is `permitAll` (`SecurityConfig.java:56`) and exempt from rate limiting (`ApiRateLimitFilter.java:32`). Guarded only by `userRepository.count() == 0`.
  - Bind setup to localhost, require a bootstrap secret, or remove the rate-limit exemption.

## High

- [x] **3. Fix refresh-token cookie path on logout**
  - `CookieService.java:27` sets `Path=/api/v1/auth` but `AuthController.java:91` clears it with `Path=/`. Browser keeps the original cookie.
  - Clear the cookie with the same path it was set with.

- [x] **4. Add `@PreAuthorize` to `UserController.findAll` / `findById`**
  - `UserController.java:42, 49` — any authenticated user can enumerate all users and roles.
  - Add `@PreAuthorize("hasAnyRole('ADMIN','SYSTEM_ADMIN')")`.

- [x] **5. Audit CORS allow-list**
  - `WebConfig.java:23-31` uses `allowCredentials(true)` with a configurable origin list. With CSRF disabled, any allowed origin becomes a full CSRF surface.
  - Keep the allow-list strict; document that adding an origin grants CSRF-equivalent trust.

## Medium

- [x] **6. Mitigate login user-enumeration timing**
  - `AuthController.login` — missing user skips the BCrypt compare, leaking presence via timing.
  - Hash a dummy password on the not-found path so the timing matches.

- [x] **7. Single-instance the maintenance scheduler**
  - `MaintenanceScheduler.java:19` — `@Scheduled` runs on every JVM, duplicating weekly emails in multi-instance deploys.
  - Add ShedLock or restrict the job to a single replica.

- [ ] **8. Plan for distributed rate limiting**
  - `LoginRateLimiterService`, `ForgotPasswordRateLimiterService`, `ApiRateLimitFilter` use per-JVM Caffeine caches; counts reset on restart and don't span instances.
  - Move to Redis when scaling horizontally.

## Low

- [ ] **9. Add `@Version` optimistic locking to `Equipment`, `Procedure`, `User`** to prevent silent concurrent overwrites.

- [ ] **10. Limit import payload size beyond the 10MB multipart cap**
  - `ImportService` loads the full JSON into memory; add a per-item count limit.
