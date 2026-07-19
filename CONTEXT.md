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

## Equipment mapping

**EquipmentMapper** — the one place that translates between the
Equipment/Procedure/Perform entity graph and its DTO shapes. Package-private,
no Spring bean, no mapping framework — static methods only: `toEntity`/
`applyTo`/`toResponse` for the CRUD shape (`EquipmentRequest`/
`EquipmentResponse`), and `toEntity(EquipmentTransfer)`/`toTransfer` for the
whole-graph import/export shape. Every entity↔DTO field copy for Equipment
lives here; `EquipmentService`, `ImportService`, and `ExportService` call into
it rather than setting fields themselves. Lives in the `service` package.

**EquipmentTransfer** (with nested **ProcedureTransfer**/**PerformTransfer**)
— the shared import/export shape (`dto` package). One record used both to
parse an import file and to serialize an export, so the *round-trip
invariant* — an exported file can be re-imported unchanged — holds by
construction rather than by convention (previously two independently
hand-maintained shapes, `ImportRequest`/`ExportResponse`, had to be kept in
sync by hand). Distinct from `EquipmentRequest`/`EquipmentResponse`, which
serve the single-item CRUD API and carry different validation semantics.

**EquipmentStatus** — closed enum (`ACTIVE`, `IN_USE`, `UNDER_REPAIR`,
`DECOMMISSIONED`, `IN_STORAGE`) with a display-name↔enum JSON contract
(`"Active"`, `"In Use"`, etc. via `@JsonValue`/`@JsonCreator`). The wire
format is the display name, never the enum constant name. Lives in `util`.

## Dashboard due-status

**DueDetails** — the single owner of "when is maintenance due": computes
days-till-due from a procedure's `intervalDays` and its most recent
`Perform` history entry (`ChronoUnit.DAYS`). There is no other implementation
of this rule anywhere in the codebase — a duplicate once existed on the
frontend (`procedureUtils.ts`) and was deleted as dead code; the frontend
does zero due-date math of its own and renders backend-supplied fields
verbatim. Lives in `util`.

**DueStatus** — closed enum (`OVERDUE`, `UPCOMING`, `NO_HISTORY`) that
`DueDetails` returns, consumed by `DashboardService` and `EmailService`
instead of raw string literals. Each constant carries its wire value
(`"OVERDUE"`, `"Upcoming"`, `"No history"`) via `@JsonValue`, so the JSON/HTML
output is unchanged from before the enum existed. The frontend has a
matching `DueStatus` TypeScript union (`src/types/equipment.ts`) with the
same three literal strings. Lives in `util`.

**DashboardItem** — the equipment×procedure due-date rollup unit: one row
per (equipment, procedure) pair, carrying `daysTillDue`, `dueDate`, and
`status` (a `DueStatus`). The grain is per-procedure, not per-equipment — a
piece of equipment with three procedures produces three `DashboardItem`s.
Lives in `dto`.

## Authorization

**RoleTier** — the tiered `@PreAuthorize` role ladder from ADR-0028: `READ`
(any authenticated role) < `WRITE` (`EDIT` and above) < `MANAGE_USERS`
(`ADMIN` and above) < `EMAIL` (dashboard-email trigger, aligned to
`MANAGE_USERS`). `SYSTEM_ADMIN` is the superset role and appears in every
tier. Also owns the *caller-can-manage-role* rule (`canManageRole`/
`assertCallerCanManageRole`): `SYSTEM_ADMIN` may manage any role; `ADMIN` may
manage only `USER`/`EDIT`/`ADMIN`; anything else is forbidden. Lives in
`service`.

**CallerContext** — the authenticated caller of the current request,
exposed as behavior (`isSystemAdmin()`, `hasRole(name)`, `canManage(role)`,
`assertCanManage(role)`) rather than a raw `Set<String>` of role names. Built
once, by `CallerContextArgumentResolver` (a `HandlerMethodArgumentResolver`
in `config`), from the current `Authentication` — the `"ROLE_"` authority
prefix is stripped in exactly that one place. Controllers declare a
`CallerContext` parameter instead of extracting `currentUserId`/role sets by
hand; `UserService` takes one `CallerContext` parameter instead of separate
`UUID`/`Set<String>` parameters. Lives in `service`.

## Token hash-at-rest

**TokenHasher** — `sha256Hex(value)`: the one place refresh tokens and
password-reset tokens are hashed before persistence. Token columns store the
SHA-256 hex digest; the raw token value is returned to the client once (at
issuance) and never persisted. Lives in `util`.
