# US-001 Backend Integration Tests — Plan

## Context

US-001 (Initial Admin Setup) is currently covered only by unit tests in
[SetupControllerTest.java](backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/SetupControllerTest.java)
using MockMvc + Mockito. Unit tests prove the controller logic in isolation, but do not prove that the real
Spring Security filter chain, Postgres schema, BCrypt encoding, JWT issuance, and refresh-token persistence work
together end-to-end against the production database engine.

This plan adds the first `*IT.java` integration tests in the project, bootstrapping reusable IT infrastructure
(Testcontainers + base class) that later epics (auth, equipment, procedures) will extend.

## Decisions (from interview)

- **Test DB:** Testcontainers Postgres (matches prod Postgres 18).
- **Isolation:** Explicit `deleteAll()` in `@BeforeEach` — exercise real commit semantics, not transactional rollback.
- **HTTP driver:** `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `TestRestTemplate` — real HTTP, real cookie
  headers.
- **Structure:** Abstract `BaseIT` class in `support/` package; each IT extends it.
- **Scope:** Prove integrated behavior US-001 promises. Skip validation-variant duplication (unit tests cover it)
  and exhaustive cookie-attribute assertions (unit tests cover it). Redirect ACs (#4, #5) are frontend concerns —
  backend ITs assert the contract that drives those redirects (status flip, 409 on re-setup).

## Files to Create

### 1. Maven dependency

**File:** [backend/pom.xml](backend/pom.xml)

Add Testcontainers BOM + `postgresql` module + `junit-jupiter` module in `<dependencies>` with `<scope>test</scope>`.
Versions managed by `testcontainers-bom`.

### 2. Test base class

**File:** `backend/src/test/java/com/mrpaulwoods/equipment/backend/support/BaseIT.java`

Responsibilities:

- `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)`
- `@Testcontainers` with static `@Container PostgreSQLContainer<?>` (image `postgres:18`), reused across tests in
  the suite (container starts once per JVM).
- `@DynamicPropertySource` method wiring `spring.datasource.url`, `spring.datasource.username`,
  `spring.datasource.password` from the container.
- `@Autowired TestRestTemplate restTemplate` field.
- `@Autowired UserRepository userRepository` and `@Autowired RefreshTokenRepository refreshTokenRepository`.
- `@BeforeEach` that calls `refreshTokenRepository.deleteAll()` then `userRepository.deleteAll()` (FK order).
- Protected helper `url(String path)` → `"http://localhost:" + port + path`.

### 3. Test configuration (if needed)

**File:** `backend/src/test/resources/application-test.properties` (or `application-test.yml`)

Any properties required for the test profile (e.g., `app.jwt.secret` if not default, scheduling disabled). Activate
via `@ActiveProfiles("test")` on `BaseIT`.

### 4. The integration test

**File:** `backend/src/test/java/com/mrpaulwoods/equipment/backend/controller/SetupControllerIT.java`

Extends `BaseIT`. Contains exactly these 7 tests:

| # | Test method                                                     | What it proves                                                                                                                                                                          |
|---|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | `status_returnsSetupRequiredTrue_whenNoUsersExist`              | `GET /api/setup/status` → 200, body `{"setupRequired":true}` on empty DB.                                                                                                               |
| 2 | `status_returnsSetupRequiredFalse_whenAdminExists`              | Seed ADMIN via `UserService.createInternal`, `GET /api/setup/status` → `{"setupRequired":false}`.                                                                                       |
| 3 | `setup_createsFirstUserAsAdmin_andPersistsBcryptHashedPassword` | `POST /api/setup` with email+password → 200. Assert single `users` row, `role=ADMIN`, `password != plaintext`, `BCryptPasswordEncoder.matches(plaintext, hash) == true`.                |
| 4 | `setup_issuesAccessAndRefreshCookies_andPersistsRefreshToken`   | After successful `POST /api/setup`, response has `Set-Cookie: access_token=...` and `Set-Cookie: refresh_token=...`, and exactly one `refresh_token` row exists linked to the new user. |
| 5 | `setup_returnsConflict_whenAnyUserAlreadyExists`                | Seed a user (ADMIN or USER), `POST /api/setup` → 409. Assert user count unchanged, no new refresh token rows.                                                                           |
| 6 | `setup_afterSuccess_statusFlipsToSetupRequiredFalse`            | End-to-end: status (true) → setup (200) → status (false).                                                                                                                               |
| 7 | `setup_issuedAccessTokenAuthenticatesProtectedEndpoint`         | Extract `access_token` cookie from setup response, attach to `GET /api/equipment`, expect 200 (not 401). Proves "user is logged in" AC end-to-end.                                      |

## Files to Reuse (no changes)

- [SetupController.java](backend/src/main/java/com/mrpaulwoods/equipment/backend/controller/SetupController.java) —
  `GET /api/setup/status`, `POST /api/setup`.
- [SetupRequest.java](backend/src/main/java/com/mrpaulwoods/equipment/backend/dto/SetupRequest.java) — request body DTO.
- [UserService.java](backend/src/main/java/com/mrpaulwoods/equipment/backend/service/UserService.java) —
  `createInternal(email, password, role)` for seeding users in tests 2 and 5.
- [UserRepository.java](backend/src/main/java/com/mrpaulwoods/equipment/backend/repository/UserRepository.java),
  `RefreshTokenRepository` — for assertions and cleanup.
- [SecurityConfig.java](backend/src/main/java/com/mrpaulwoods/equipment/backend/config/SecurityConfig.java) — provides
  the `BCryptPasswordEncoder` bean for hash verification in test 3.

## Out of Scope

- Frontend redirect behavior (AC #4, #5) — belongs in a frontend E2E/unit test, not backend IT.
- Exhaustive cookie attribute assertions (HttpOnly, SameSite, Secure flag per environment) — covered by existing
  unit tests in `SetupControllerTest.java`.
- Validation variants (malformed email, blank password, etc.) — covered by existing unit tests; Bean Validation
  is a framework behavior we should not re-prove at the IT layer.

## Verification

1. **Build passes:** `./mvnw clean verify` (failsafe picks up `*IT.java`, surefire still runs existing `*Test.java`).
2. **All 7 ITs green** against a fresh Testcontainers Postgres.
3. **Existing unit tests unaffected:** `./mvnw clean test` still passes with no changes to unit test count.
4. **Docker required:** document in test class Javadoc that Docker must be running locally (Testcontainers
   requirement). CI runners must have Docker-in-Docker or a Docker socket.
5. **Manual sanity:** run `SetupControllerIT` in isolation from IDE; confirm container starts, tests pass,
   container stops cleanly.
