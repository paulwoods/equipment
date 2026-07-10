# PRD — Architecture Deepening: Equipment Project

**Date:** 2026-07-09 (grilled and updated same day)
**Status:** Grilled — design decisions recorded per workstream; ready for implementation approval
**Source:** `/improve-codebase-architecture` review (2026-07-09). Full illustrated report was generated to the OS temp directory; this PRD is the durable record. Design decisions below were resolved in a grilling session on 2026-07-09 and are marked **Decision**.
**Vocabulary:** module / interface / seam / depth / adapter / leverage / locality per the `/codebase-design` skill; domain terms per `CONTEXT.md`.

## 1. Background

The architecture review surfaced seven friction points across the three modules (`equipment-backend`, `equipment-frontend`, `equipment-e2e`). None are outages-in-waiting; all are shallowness or seam-leakage that taxes every future change. The backend is well-tested (34 test files); the frontend has **zero** unit tests despite Vitest being fully configured — several workstreams below are chosen specifically to create the first testable frontend interfaces.

## 2. Goals

1. **Locality** — single-owner modules for the Equipment field list, the "due" computation, caller identity, and the HTTP error contract, so a change (or bug fix) lands in one place.
2. **Testability through interfaces** — import parsing, dashboard sort/filter, and persisted UI state become exercisable without MockMvc or full-page rendering.
3. **Finish existing ADR decisions** — RFC7807 everywhere (ADR-0020), refresh-token rotation actually used by the frontend (ADR-0004/0013).
4. **Domain glossary coverage** — `CONTEXT.md` names the load-bearing concepts it currently omits.

## 3. Non-goals

- No re-litigation of recorded ADRs (JWT cookie auth, Caffeine rate limiting, UUID PKs, submodule split, etc.).
- No new runtime dependencies (no MapStruct, no react-query).
- No behavior changes visible to end users, with two deliberate exceptions: the 401→refresh→retry flow (WS-5, removes spurious logouts) and the `RoleTier.EMAIL` alignment (WS-4, SYSTEM_ADMIN gains dashboard-email access).
- No general dead-code sweep; only dead code created-or-touched by these workstreams is removed.

## 4. Workstreams

### WS-1 · One mapping seam for the Equipment shape — **Strong, do first**

**Files:** `service/EquipmentService.java:44-83`, `service/ImportService.java:34-43`, `service/ExportService.java:32-45`, `service/DashboardService.java:41-55`, `dto/EquipmentResponse`, `dto/ExportResponse`, `dto/ImportRequest`.

**Problem.** The 8-field Equipment shape (manufacturer, modelNumber, serialNumber, assetTag, location, status, description, purchaseDate) is hand-mapped in ≥5 implementations and reified as 4 near-identical DTO records. Adding a field means editing ~7 files with no compiler safety net. Deletion test: the mappings are pass-throughs — delete them and complexity vanishes rather than reappearing.

**Decision (grilled 2026-07-09).**
- The seam is a **dedicated `EquipmentMapper` class** with static methods (`toEntity`, `applyTo(entity)`, `toResponse`, `toTransfer`). No Spring bean, no mapping framework; the entity stays free of DTO imports.
- The mapper owns the **whole import/export graph** — equipment → procedures → perform history — not just the 8 flat fields. `ImportService`/`ExportService` keep orchestration only (validation, counting, transactions, `saveAll`).
- **DTO collapse: merge import and export shapes only.** One shared transfer record replaces `ImportRequest.EquipmentImport` and `ExportResponse`, making the round-trip invariant true by construction. `EquipmentRequest` (bean validation) and `EquipmentResponse` (+id) stay separate.

**Requirements.**
- All five call sites route through `EquipmentMapper`; the field list lives in exactly one file.
- A round-trip test (export → serialize → re-import) still exists as a belt-and-braces check on the shared record.

**Acceptance.** Adding a hypothetical 9th field compiles-or-fails in one module; existing backend tests pass unchanged or with mechanical updates only; round-trip test passes.

### WS-2 · DueDetails owns "due"; delete the frontend copy — **Strong**

**Files:** backend `util/DueDetails.java:13-32`, frontend `lib/procedureUtils.ts` (entire file), status strings in `DueDetails`, `DashboardService`, `EmailService`, `DashboardPage`.

**Problem.** The "when is maintenance due" rule exists in Java (`ChronoUnit.DAYS`) and TypeScript (`Math.floor` over milliseconds — subtly different around DST). The TS copy has zero importers: the backend already returns `daysTillDue`/`dueDate`/`status` in `DashboardItem`. The status values ("OVERDUE"/"Upcoming"/"No history") are stringly-typed across four files. Verified during grilling: `procedureUtils.ts` contains *only* the dead function, and `CalendarView` does month-grid math only — it renders backend-supplied `dueDate`/`isOverdue`.

**Decision (grilled 2026-07-09).** **Backend `DueStatus` enum + matching TypeScript union type** in `types/`. Wire format keeps the existing strings — no migration, compile-time safety on both tiers.

**Requirements.**
- Delete `lib/procedureUtils.ts` entirely.
- `DueDetails`, `DashboardService`, `EmailService` consume the `DueStatus` enum; literals appear once.
- Frontend renders `DashboardItem` fields verbatim, typed by the union — no client-side date math for due-ness.
- `CONTEXT.md` gains **DueDetails**, **DueStatus**, and **DashboardItem** entries (WS-8).

**Acceptance.** Grep finds the due computation in exactly one module; the status literals appear once in the backend and once in the TS union; dashboard and email output unchanged (existing tests confirm).

### WS-3 · Push import parsing behind the ImportService interface — **Strong**

**Files:** `controller/EquipmentController.java:45,72-86`, `service/ImportService.java`.

**Problem.** "Import a file" is split across the seam: the controller owns Jackson internals (`TypeFactory`, `StreamReadException`), empty-file validation, and JSON-error translation; `ImportService` only accepts a pre-parsed `List`. The interesting failure modes are reachable only via MockMvc.

**Decision (grilled 2026-07-09).** Service interface takes **`InputStream`** (not `MultipartFile` — keeps spring-web types out of the service). The service performs the empty/blank-content check itself. Existing semantics preserved exactly: all-or-nothing `@Transactional` import, collect-every-violation validation (users fixing a large file see all errors at once). Graph mapping delegates to WS-1's `EquipmentMapper`.

**Requirements.**
- `ImportService` interface becomes `InputStream → ImportResult` (parse, validate, map via mapper, persist).
- Controller shrinks to a one-liner; `ObjectMapper` injection leaves the controller.
- Unit tests cover: empty file, invalid JSON, malformed rows, happy path — all through the service interface.

**Acceptance.** `ImportServiceTest` exercises all parse/validation failure modes without MockMvc; controller test reduces to routing + status codes.

### WS-4 · CallerContext at the authorization seam — **Worth exploring; security-auditor review required**

**Files:** `controller/UserController.java:97-112`, `service/UserService.java:57-104,146-158`, `service/RoleTier.java`, `filter/JwtAuthFilter.java`.

**Problem.** Caller identity has no module: the controller strips the `"ROLE_"` prefix by hand and threads `currentUserId` + a loose `Set<String>` into every `UserService` method, where `"SYSTEM_ADMIN"` literals guard branches. Calling a service method with the wrong set silently bypasses a check. `RoleTier` is deep (it already centralizes the `@PreAuthorize` tier strings per ADR-0028) and stays as-is.

**Decision (grilled 2026-07-09).**
- `CallerContext` is built by a **`HandlerMethodArgumentResolver`** from the SecurityContext; controllers declare a `CallerContext` parameter and lose all identity code. The `"ROLE_"` strip happens in exactly one place.
- Because roles are DB rows (ADR-0005), `CallerContext` wraps the role names and exposes **behavior** — `userId()`, `canManage(targetRole)`, `isSystemAdmin()` — not a raw `Set<String>`.
- **`RoleTier.EMAIL` aligns to `MANAGE_USERS`** (resolving the in-code TODO): SYSTEM_ADMIN gains dashboard-email access, consistent with ADR-0028's superset-role rule. Deliberate behavior change, covered by a test, folded into this workstream.

**Requirements.**
- No `Set<String>` role parameters remain on `UserService`; role-name literals move inside `CallerContext`/`RoleTier`.
- Aligns with ADR-0028; this hardens it, it does not reopen it.

**Acceptance.** No string role sets cross the controller→service seam; `security-auditor` pass on the diff comes back clean; existing authorization e2e spec passes; new test covers SYSTEM_ADMIN triggering the dashboard email.

### WS-5 · Make the frontend HTTP module a real seam — **Strong**

**Files:** `lib/apiClient.ts:12-15`, `api/client.ts:7-52`.

**Problem.** `apiClient.ts` looks like the seam for cross-cutting HTTP concerns but its only interceptor is a no-op pass-through. `api/client.ts` invents a second error model (`postWithStatus` → `{ok, status}`) just for auth calls. And despite backend refresh-token rotation (ADR-0004), there is no 401→refresh→retry anywhere — expired access tokens surface as failures.

**Decision (grilled 2026-07-09).** **One error model: a typed `ApiError`, thrown.** The interceptor parses RFC7807 bodies into `ApiError` (status, title, detail) and rejects with it; `postWithStatus` is deleted and auth callers use try/catch like every other call site. Pairs with WS-6's envelope work.

**Requirements.**
- Response interceptor implements 401 → `POST /api/v1/auth/refresh` → retry-once; concurrent 401s share a single in-flight refresh; refresh failure clears auth state and routes to login exactly once. The refresh, login, and logout endpoints themselves never trigger a refresh attempt.
- All `api/client.ts` callers migrate to the `ApiError` model.
- Unit tests via a fake adapter (axios mock) behind the seam: refresh success, refresh failure, concurrent-request coalescing, non-401 passthrough, RFC7807 parsing.

**Acceptance.** An expired access token during an active session is invisible to the user (verify manually or via e2e with shortened token lifetime); `postWithStatus` is gone; interceptor unit tests pass.

### WS-6 · Route the stray error path through the RFC7807 seam; type the success bodies — **Worth exploring**

**Files:** `controller/EmailController.java:31-37`, `controller/AuthController.java:45,75,82`.

**Problem (rescoped during grilling).** ADR-0032 audit found the `AuthController` `Map.of` bodies are **success** responses — including the deliberately constant forgot-password message ADR-0032 mandates — so they don't violate the RFC7807 *error* envelope. The only true violation is `EmailController`'s `catch (Exception)` → 500 `Map.of("error", …)`, which bypasses `GlobalExceptionHandler` (ADR-0020).

**Decision (grilled 2026-07-09).** **Fix the error path and type the successes.** `EmailController` lets exceptions propagate to `GlobalExceptionHandler`; the ad-hoc success `Map.of` bodies (auth + email) become small response records for compile-time safety. Wire shapes unchanged; ADR-0032 semantics untouched.

**Requirements.**
- No `catch (Exception)` → `Map` error bodies remain in controllers.
- The forgot-password response keeps its exact constant message and shape (ADR-0032).
- Frontend error handling (post-WS-5) parses one envelope.

**Acceptance.** Email-send failure returns an RFC7807 problem detail; anti-enumeration behavioral checks unchanged; no `Map.of(` in controllers.

### WS-7 · Lift DashboardPage persistence and fetching into hooks — **Worth exploring**

**Files:** `pages/DashboardPage.tsx` (287 LOC); pattern recurs in `UsersPage`, `ProfilePage`, `EquipmentShowPage`.

**Problem.** One module, no internal seams: the guarded `JSON.parse(localStorage…)` block appears three times, plus fetch-with-refreshCount, filter/sort branching, and dual (desktop/mobile) renders. The bug-prone sort/filter logic is testable only by rendering the whole page.

**Decision (grilled 2026-07-09).** **Pure functions + thin hooks.** Sort/filter become pure functions in `lib/` (testable with plain Vitest, no React rendering); `usePersistedState(key, default)` hides the parse/guard/write; a small `useDashboardData` hook owns fetch + refresh and composes the pure functions. The page becomes presentation.

**Requirements.**
- Vitest tests for the pure functions and both hooks — the project's **first frontend unit tests**, establishing the pattern.
- Scope: DashboardPage only. Other pages adopt the hooks opportunistically, not in this workstream.

**Acceptance.** `npm test` runs ≥2 meaningful test files; DashboardPage contains no direct `localStorage` access; sort/filter covered by pure-function tests.

### WS-8 · Name the missing domain concepts in CONTEXT.md — **Strong, zero risk**

**Problem.** `CONTEXT.md` names only the rate-limiting vocabulary. Load-bearing but unnamed: **DueDetails** (the due computation), **DueStatus**, **DashboardItem** (the equipment×procedure grain), **RoleTier** (the tier ladder + "manage at-or-below your tier" rule), **CallerContext** (once WS-4 lands), **EquipmentStatus** (display-name↔enum contract), **Import/Export round-trip** (the mirrored-shape invariant — by construction after WS-1), **hash-at-rest** (`TokenHasher`: token columns store SHA-256 hex, raw never persisted).

**Requirements.** Add each term in the existing CONTEXT.md style (definition, where it lives, what stays out of it). Entries reflect the grilled decisions above (e.g. DueStatus as enum + TS union; the transfer record as the round-trip carrier). Update entries as WS-1/2/4 ship.

**Acceptance.** Every term above resolves to a CONTEXT.md entry consistent with the shipped code.

### WS-9 · Test backfill for security-relevant modules — **promoted from out-of-scope during grilling**

**Files:** `service/CookieService.java`, `service/RefreshTokenService.java`, `util/TokenHasher.java`, `filter/ApiRateLimitFilter.java` — all currently have zero direct tests.

**Rationale.** WS-4/5/6 touch auth-adjacent code; direct tests on the token/cookie modules should exist **before** those diffs land, so regressions surface as test failures rather than security incidents.

**Requirements.**
- `CookieService`: cookie flags, secure-override, path scoping, max-age derivation from `AppProperties`.
- `RefreshTokenService`: rotation, expiry, hash-at-rest (raw token never persisted), token-version revocation interplay (ADR-0029/0030).
- `TokenHasher`: deterministic SHA-256 hex output, null/edge handling.
- `ApiRateLimitFilter`: atomic increment-then-check semantics against a `WindowedCounter` with a fake `Ticker` (per CONTEXT.md).

**Acceptance.** Each of the four modules has a direct test class; `./mvnw test` green; scheduled to complete before Phase 3 begins.

## 5. Out-of-scope findings (recorded, not scheduled)

- **E2E gaps:** no coverage for dashboard due-date correctness, calendar, password-reset flow, profile self-service. (Considered for promotion during grilling; deliberately kept unscheduled to preserve focus.)

## 6. Sequencing

| Phase | Workstreams | Rationale |
|---|---|---|
| 1 | WS-8, WS-2, WS-9 (start) | Zero-risk vocabulary + dead-code deletion; test backfill starts immediately |
| 2 | WS-1, then WS-3; WS-9 (complete) | WS-3's service consumes WS-1's mapper; security tests in place before auth-adjacent phases |
| 3 | WS-5, then WS-6 | Frontend error model should exist before the backend envelope work |
| 4 | WS-7 | Uses the WS-5 test pattern; independent of the rest |
| 5 | WS-4 | Security-adjacent; design already grilled; review with security-auditor |

Each workstream: run the module's test suite before and after (backend `./mvnw test`, frontend `npm test`); e2e (`npm run e2e`) at the end of each phase. One commit (or small stack) per workstream; lockstep versioning per ADR-0023.

## 7. Risks

- **WS-4 and WS-6 touch authorization/auth responses.** Mitigation: WS-9 tests land first; security-auditor review on the diff; ADR-0032 audit already done (grilling) — forgot-password shape is frozen; authorization e2e spec must pass.
- **WS-4's EMAIL-tier alignment is a deliberate permission widening.** Mitigation: explicit test; called out in the commit message; ADR-0028 footnote updated.
- **WS-5 retry logic can loop or stampede.** Mitigation: retry-once flag per request; single shared in-flight refresh promise; refresh/login/logout endpoints excluded from retry; explicit tests for each.
- **WS-1 could over-abstract.** Constraint: no mapping framework; plain class + records only. If the mapper's interface grows beyond toEntity/applyTo/toResponse/toTransfer, stop and re-grill.

## 8. Success metrics

- Equipment field addition touches 1 module instead of ~7.
- Frontend unit test count: 0 → ≥2 files with meaningful coverage (WS-7), plus interceptor tests (WS-5).
- One HTTP error contract end-to-end: RFC7807 on the wire (WS-6), typed `ApiError` in the client (WS-5).
- Four security-relevant modules gain direct tests (WS-9).
- No user-visible regressions beyond the two deliberate changes (refresh flow, EMAIL tier): full backend, frontend, and e2e suites green at every phase boundary.
