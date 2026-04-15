# Equipment Maintenance Management System — Technical Specification

**Version:** 2.0.12  
**Stack:** Spring Boot 4 / Java 25 backend · React 19 / TypeScript SPA frontend · PostgreSQL 18  
**Deployment:** Docker Compose + Caddy reverse proxy

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Backend](#4-backend)
    - 4.1 [Package Structure](#41-package-structure)
    - 4.2 [Entities](#42-entities)
    - 4.3 [REST API](#43-rest-api)
    - 4.4 [Security](#44-security)
    - 4.5 [Business Logic](#45-business-logic)
    - 4.6 [Scheduled Tasks](#46-scheduled-tasks)
    - 4.7 [Configuration](#47-configuration)
5. [Frontend](#5-frontend)
    - 5.1 [Directory Structure](#51-directory-structure)
    - 5.2 [Routing](#52-routing)
    - 5.3 [API Client](#53-api-client)
    - 5.4 [TypeScript Types](#54-typescript-types)
    - 5.5 [Key Components & Pages](#55-key-components--pages)
6. [Deployment](#6-deployment)
    - 6.1 [Environment Variables](#61-environment-variables)
    - 6.2 [Docker Compose (Production)](#62-docker-compose-production)
    - 6.3 [Caddy (Reverse Proxy / TLS)](#63-caddy-reverse-proxy--tls)
    - 6.4 [Local Development](#64-local-development)
7. [Testing](#7-testing)

---

## 1. Overview

The Equipment Maintenance Management System tracks physical equipment assets and the recurring maintenance procedures
required to keep them operational. It supports two user roles:

- **ADMIN** — full CRUD over equipment and procedures, bulk import, email triggers
- **USER** — read equipment/procedures, record procedure execution history

Core capabilities:

| Capability             | Description                                                                     |
|------------------------|---------------------------------------------------------------------------------|
| Equipment inventory    | Create, read, update, delete physical assets with status tracking               |
| Maintenance procedures | Define recurring tasks per equipment with an interval in days                   |
| Procedure execution    | Record dated "perform" events with notes; builds a history log                  |
| Dashboard              | Flattened, sorted view of all procedures showing days-till-due / overdue        |
| Calendar view          | Calendar visualization of upcoming due dates                                    |
| Email reporting        | HTML email with maintenance status table, sent manually or on a weekly schedule |
| Bulk import            | JSON file upload to batch-create equipment, procedures, and history             |
| Authentication         | JWT-based login with access + refresh token rotation (httpOnly cookies)         |

---

## 2. Architecture

```
Browser (React SPA)
       │  HTTPS
       ▼
  Caddy (TLS termination, reverse proxy)
       │
       ├──── /api/*  ──────► Spring Boot (port 8080)
       │                          │
       └──── /*  ─────────► React static files (nginx, port 80)
                                  │
                            PostgreSQL 18
```

**Backend:** Spring Boot 4.0.5, Java 25, Maven. Stateless REST API, JWT auth, Flyway migrations, Spring Data JPA /
Hibernate, Spring Mail (SMTP/Gmail), Caffeine in-memory cache, Spring Scheduling.

**Frontend:** React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, React Router 7, EasyMDE (markdown editor), next-themes (
dark mode), Lucide React icons, Vitest tests.

**Database:** PostgreSQL 18. Schema managed exclusively by Flyway (`ddl-auto: validate`).

---

## 3. Database Schema

Migration file: `backend/src/main/resources/db/migration/V1__create_schema.sql`

```sql
CREATE TABLE equipment
(
    id            UUID PRIMARY KEY,
    manufacturer  VARCHAR(255) NOT NULL,
    model_number  VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    asset_tag     VARCHAR(255),
    location      VARCHAR(255),
    status        VARCHAR(50)  NOT NULL,
    description   TEXT,
    purchase_date DATE
);

CREATE TABLE procedure
(
    id             UUID PRIMARY KEY,
    equipment_id   UUID         NOT NULL REFERENCES equipment (id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    steps          TEXT,
    required_tools TEXT,
    interval_days  INT          NOT NULL
);

CREATE TABLE perform
(
    id           UUID PRIMARY KEY,
    procedure_id UUID NOT NULL REFERENCES procedure (id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    notes        TEXT
);

CREATE TABLE users
(
    id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE refresh_token
(
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(512) NOT NULL UNIQUE,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMP    NOT NULL
);
```

**Entity relationships:**

```
equipment  1 ──── N  procedure  1 ──── N  perform
users      1 ──── N  refresh_token
```

All child records cascade-delete when the parent is deleted.

---

## 4. Backend

### 4.1 Package Structure

Base package: `com.mrpaulwoods.equipment.backend`

```
backend/src/main/java/com/mrpaulwoods/equipment/backend/
├── BackendApplication.java
├── config/
│   ├── AppProperties.java          # @ConfigurationProperties binding for app.*
│   ├── JwtSecretValidator.java     # Startup validation of JWT secret
│   ├── SecurityConfig.java         # Spring Security filter chain
│   └── WebConfig.java              # CORS, forward headers
├── controller/
│   ├── AuthController.java
│   ├── DashboardController.java
│   ├── EmailController.java
│   ├── EquipmentController.java
│   ├── PerformHistoryController.java
│   ├── ProcedureController.java
│   └── SetupController.java
├── dto/
│   ├── DashboardItem.java
│   ├── EquipmentRequest.java
│   ├── ImportRequest.java          # EquipmentImport nested class
│   ├── ImportResult.java
│   ├── LoginRequest.java
│   ├── PerformRequest.java
│   ├── ProcedureRequest.java
│   ├── SetupRequest.java
│   ├── UserRequest.java
│   └── UserResponse.java
├── entity/
│   ├── Equipment.java
│   ├── Perform.java
│   ├── Procedure.java
│   ├── RefreshToken.java
│   └── User.java
├── exception/
│   ├── EquipmentNotFoundException.java
│   ├── GlobalExceptionHandler.java
│   ├── ImportEquipmentException.java
│   └── ProcedureNotFoundException.java
├── filter/
│   └── JwtAuthFilter.java          # Reads JWT from access_token cookie
├── repository/
│   ├── EquipmentRepository.java
│   ├── PerformRepository.java
│   ├── ProcedureRepository.java
│   ├── RefreshTokenRepository.java
│   └── UserRepository.java
├── scheduler/
│   └── MaintenanceScheduler.java   # Weekly email, Saturday 7 AM CT
├── service/
│   ├── DashboardService.java
│   ├── EmailService.java
│   ├── EquipmentService.java
│   ├── ImportService.java
│   ├── JwtService.java
│   ├── LoginRateLimiterService.java
│   ├── PerformHistoryService.java
│   ├── ProcedureService.java
│   ├── RefreshTokenService.java
│   ├── UserDetailsServiceImpl.java
│   └── UserService.java
└── util/
    ├── DueDetails.java             # Record: daysTillDue, dueDate, status()
    ├── EquipmentStatus.java        # Enum with JSON display names
    └── Role.java                   # Enum: ADMIN, USER
```

### 4.2 Entities

#### Equipment

| Field          | Type              | Required | Notes                           |
|----------------|-------------------|----------|---------------------------------|
| `id`           | UUID              | Yes      | Generated via `@PrePersist`     |
| `manufacturer` | String            | Yes      |                                 |
| `modelNumber`  | String            | Yes      | Column: `model_number`          |
| `serialNumber` | String            | No       |                                 |
| `assetTag`     | String            | No       | Column: `asset_tag`             |
| `location`     | String            | No       |                                 |
| `status`       | EquipmentStatus   | Yes      | Stored as string (display name) |
| `description`  | String            | No       | TEXT column                     |
| `purchaseDate` | LocalDate         | No       | Column: `purchase_date`         |
| `procedures`   | List\<Procedure\> | —        | `@OneToMany`, lazy, cascade ALL |

#### EquipmentStatus enum

| Enum value       | JSON / DB value    |
|------------------|--------------------|
| `ACTIVE`         | `"Active"`         |
| `IN_USE`         | `"In Use"`         |
| `UNDER_REPAIR`   | `"Under Repair"`   |
| `DECOMMISSIONED` | `"Decommissioned"` |
| `IN_STORAGE`     | `"In Storage"`     |

Deserialized from the display-name string via `@JsonCreator`. Serialized back to the display name via `@JsonValue`.

#### Procedure

| Field           | Type            | Required | Notes                             |
|-----------------|-----------------|----------|-----------------------------------|
| `id`            | UUID            | Yes      | Generated via `@PrePersist`       |
| `equipment`     | Equipment       | Yes      | `@ManyToOne`, lazy, `@JsonIgnore` |
| `name`          | String          | Yes      |                                   |
| `description`   | String          | No       | TEXT                              |
| `steps`         | String          | No       | TEXT, Markdown                    |
| `requiredTools` | String          | No       | TEXT, column: `required_tools`    |
| `intervalDays`  | int             | Yes      | Column: `interval_days`           |
| `history`       | List\<Perform\> | —        | `@OneToMany`, lazy, cascade ALL   |

#### Perform

| Field       | Type      | Required | Notes                             |
|-------------|-----------|----------|-----------------------------------|
| `id`        | UUID      | Yes      | Generated via `@PrePersist`       |
| `procedure` | Procedure | Yes      | `@ManyToOne`, lazy, `@JsonIgnore` |
| `date`      | LocalDate | Yes      |                                   |
| `notes`     | String    | No       | TEXT                              |

#### User

| Field       | Type          | Notes                   |
|-------------|---------------|-------------------------|
| `id`        | UUID          | `@GeneratedValue(UUID)` |
| `email`     | String        | Unique, not null        |
| `password`  | String        | BCrypt-hashed           |
| `role`      | Role          | `ADMIN` or `USER`       |
| `createdAt` | LocalDateTime | Defaults to `now()`     |

#### RefreshToken

| Field       | Type          | Notes                |
|-------------|---------------|----------------------|
| `id`        | UUID          |                      |
| `token`     | String        | Unique, VARCHAR(512) |
| `user`      | User          | `@ManyToOne`         |
| `expiresAt` | LocalDateTime |                      |

### 4.3 REST API

All endpoints under `/api/**` require authentication except the ones marked public.

#### Authentication — `/api/auth`

| Method | Path                | Auth          | Description                                                                                                                                                                         |
|--------|---------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| POST   | `/api/auth/login`   | Public        | Authenticate with email + password. Returns `{"email": "..."}`. Sets `access_token` (1 hr, path `/`) and `refresh_token` (7 days, path `/api/auth`) httpOnly cookies. Rate-limited. |
| POST   | `/api/auth/logout`  | Public        | Deletes refresh tokens for current user. Clears both cookies.                                                                                                                       |
| POST   | `/api/auth/refresh` | Public        | Reads `refresh_token` cookie, rotates both tokens, sets new cookies.                                                                                                                |
| GET    | `/api/auth/me`      | Authenticated | Returns `{"email": "...", "role": "ROLE_ADMIN"}` for the current user.                                                                                                              |

#### Setup — `/api/setup`

| Method | Path                | Auth   | Description                                                                                |
|--------|---------------------|--------|--------------------------------------------------------------------------------------------|
| GET    | `/api/setup/status` | Public | Returns `{"setupRequired": true/false}`. True when no users exist.                         |
| POST   | `/api/setup`        | Public | Creates the initial ADMIN user. Only works when no users exist. Body: `{email, password}`. |

#### Equipment — `/api/equipment`

| Method | Path                    | Role        | Description                                                                                                                       |
|--------|-------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------------------|
| GET    | `/api/equipment`        | ADMIN, USER | List all equipment (with lazy procedures not expanded).                                                                           |
| GET    | `/api/equipment/{id}`   | ADMIN, USER | Get a single equipment record.                                                                                                    |
| POST   | `/api/equipment`        | ADMIN       | Create equipment. Returns 201.                                                                                                    |
| PUT    | `/api/equipment/{id}`   | ADMIN       | Update equipment.                                                                                                                 |
| DELETE | `/api/equipment/{id}`   | ADMIN       | Delete equipment and all cascaded procedures/history. Returns 204.                                                                |
| POST   | `/api/equipment/import` | ADMIN       | Multipart file upload (`file` field). Accepts JSON array of equipment with nested procedures and history. Returns `ImportResult`. |

**EquipmentRequest body:**

```json
{
  "manufacturer": "string (required)",
  "modelNumber": "string (required)",
  "serialNumber": "string",
  "assetTag": "string",
  "location": "string",
  "status": "Active | In Use | Under Repair | Decommissioned | In Storage (required)",
  "description": "string",
  "purchaseDate": "YYYY-MM-DD"
}
```

**ImportResult response:**

```json
{
  "equipmentImported": 3,
  "proceduresImported": 9,
  "historyImported": 12
}
```

#### Procedures — `/api/equipment/{equipmentId}/procedures`

| Method | Path                         | Role        | Description                                        |
|--------|------------------------------|-------------|----------------------------------------------------|
| GET    | `…/procedures`               | ADMIN, USER | List all procedures for the equipment.             |
| GET    | `…/procedures/{procedureId}` | ADMIN, USER | Get a single procedure.                            |
| POST   | `…/procedures`               | ADMIN       | Create a procedure for the equipment. Returns 201. |
| PUT    | `…/procedures/{procedureId}` | ADMIN       | Update procedure.                                  |
| DELETE | `…/procedures/{procedureId}` | ADMIN       | Delete procedure and its history. Returns 204.     |

**ProcedureRequest body:**

```json
{
  "name": "string (required)",
  "description": "string",
  "steps": "string (Markdown)",
  "requiredTools": "string",
  "intervalDays": 30
}
```

#### Perform History — `/api/equipment/{equipmentId}/procedures/{procedureId}/history`

| Method | Path        | Role        | Description                                   |
|--------|-------------|-------------|-----------------------------------------------|
| GET    | `…/history` | ADMIN, USER | List all execution records for the procedure. |
| POST   | `…/history` | ADMIN, USER | Record a new execution. Returns 201.          |

**PerformRequest body:**

```json
{
  "date": "YYYY-MM-DD",
  "notes": "string"
}
```

#### Dashboard — `/api/dashboard`

| Method | Path             | Role        | Description                                                                          |
|--------|------------------|-------------|--------------------------------------------------------------------------------------|
| GET    | `/api/dashboard` | ADMIN, USER | Returns a flat list of `DashboardItem` sorted by days-till-due (most overdue first). |

**DashboardItem shape** (computed, not stored):

```json
{
  "equipmentId": "uuid",
  "equipmentName": "Manufacturer Model",
  "procedureId": "uuid",
  "procedureName": "string",
  "intervalDays": 30,
  "daysTillDue": -5,
  "dueDate": "YYYY-MM-DD",
  "status": "OVERDUE | Upcoming"
}
```

#### Email — `/api/email`

| Method | Path                   | Role  | Description                                                                                   |
|--------|------------------------|-------|-----------------------------------------------------------------------------------------------|
| POST   | `/api/email/dashboard` | ADMIN | Manually trigger the dashboard HTML email. Returns `{"success": true}` or `{"error": "..."}`. |

### 4.4 Security

**Filter chain** (`SecurityConfig`):

- CSRF disabled (stateless API).
- Session policy: `STATELESS`.
- Public endpoints: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/setup/**`.
- All other `/api/**` require authentication.
- Everything else (static assets) permitted.
- Custom 401/403 JSON responses.

**JWT flow:**

1. `POST /api/auth/login` → Spring `AuthenticationManager` validates credentials.
2. `JwtService` generates a signed access token (HMAC-SHA, secret from `APP_JWT_SECRET`).
3. `RefreshTokenService` creates a UUID refresh token stored in `refresh_token` table with a 7-day expiry.
4. Both tokens set as httpOnly, SameSite=Lax cookies. `access_token` is secure in production (`APP_COOKIE_SECURE=true`).
5. `JwtAuthFilter` reads `access_token` cookie on every request, validates signature, and sets `SecurityContext`.
6. On 401 (expired access token), client calls `POST /api/auth/refresh` — old refresh token is deleted and a new pair is
   issued (token rotation).

**Password hashing:** BCrypt (`BCryptPasswordEncoder`).

**Method-level authorization:** `@PreAuthorize("hasRole('ADMIN')")` and `@PreAuthorize("hasAnyRole('ADMIN', 'USER')")`on
controller methods.

**Login rate limiting** (`LoginRateLimiterService`):

- Tracks failed attempts per `clientIp + email` key using Caffeine cache.
- Default: 5 max attempts, 15-minute lockout (900,000 ms).
- Configurable via `APP_LOGIN_MAX_ATTEMPTS` and `APP_LOGIN_LOCKOUT_DURATION_MS`.
- Returns HTTP 429 when blocked.
- Resets on successful login.

### 4.5 Business Logic

#### Due Date Calculation (`DueDetails`)

```
daysTillDue = intervalDays - daysSinceLastPerformed
dueDate     = today + daysTillDue
status      = daysTillDue <= 0 ? "OVERDUE" : "Upcoming"
```

- If a procedure has no history, `DueDetails.calculate()` returns `Optional.empty()` and the procedure is excluded from
  dashboard items with a due date.
- The frontend mirrors this logic in `procedureUtils.ts`.

#### Dashboard Service

1. Loads all equipment with procedures and their history (eagerly fetched for this operation).
2. For each procedure, calls `DueDetails.calculate()`.
3. Maps to `DashboardItem` records.
4. Sorts by `daysTillDue` ascending (most overdue first, then soonest upcoming).

#### Import Service

Accepts a JSON array with the shape:

```json
[
  {
    "manufacturer": "...",
    "modelNumber": "...",
    "status": "Active",
    "procedures": [
      {
        "name": "...",
        "intervalDays": 30,
        "history": [
          {
            "date": "2025-01-01",
            "notes": "..."
          }
        ]
      }
    ]
  }
]
```

Processed in a single transaction. Returns counts of created equipment, procedures, and history records.

#### Email Service

- Fetches dashboard items.
- Composes an HTML email with a status table (equipment, procedure, interval, days-till-due, due date, status).
- Sends via Spring Mail (Gmail SMTP, STARTTLS port 587).
- From address configured by `APP_SMTP_FROM`.
- Recipient list configured internally (all users, or a fixed address — see `EmailService`).

### 4.6 Scheduled Tasks

**`MaintenanceScheduler`** — conditional on `scheduling.enabled=true` (default true):

```
Cron: 0 0 7 * * SAT  (zone: America/Chicago)
```

Runs every Saturday at 7:00 AM Central Time (handles CST/CDT automatically). Calls `EmailService.sendDashboardEmail()`.
Logs success or failure.

### 4.7 Configuration

**`backend/src/main/resources/application.yaml`**

| Key                             | Env var                         | Default          | Description                                 |
|---------------------------------|---------------------------------|------------------|---------------------------------------------|
| `spring.datasource.url`         | `POSTGRES_DB`                   | —                | JDBC URL                                    |
| `spring.datasource.username`    | `POSTGRES_USER`                 | —                | DB user                                     |
| `spring.datasource.password`    | `POSTGRES_PASSWORD`             | —                | DB password                                 |
| `spring.mail.host`              | —                               | `smtp.gmail.com` | SMTP host                                   |
| `spring.mail.port`              | —                               | `587`            | SMTP port (STARTTLS)                        |
| `spring.mail.username`          | `SPRING_MAIL_USERNAME`          | —                | Gmail account                               |
| `spring.mail.password`          | `SPRING_MAIL_PASSWORD`          | —                | Gmail app password                          |
| `app.jwt-secret`                | `APP_JWT_SECRET`                | —                | Base64 HMAC secret (≥ 48 bytes recommended) |
| `app.jwt-expiration-ms`         | `APP_JWT_EXPIRATION_MS`         | `3600000`        | Access token TTL (ms)                       |
| `app.smtp-from`                 | `APP_SMTP_FROM`                 | —                | From address for emails                     |
| `app.app-url`                   | `APP_URL`                       | —                | Public URL (used in email links)            |
| `app.cookie-secure`             | `APP_COOKIE_SECURE`             | —                | `true` for HTTPS production                 |
| `app.login-max-attempts`        | `APP_LOGIN_MAX_ATTEMPTS`        | `5`              | Rate limiter threshold                      |
| `app.login-lockout-duration-ms` | `APP_LOGIN_LOCKOUT_DURATION_MS` | `900000`         | Lockout window (ms)                         |
| `scheduling.enabled`            | —                               | `true`           | Enable/disable scheduled tasks              |

Flyway runs automatically on startup. `ddl-auto: validate` means Hibernate validates the schema against entities but
does not modify it.

---

## 5. Frontend

### 5.1 Directory Structure

```
frontend/src/
├── main.tsx                        # Vite entry point
├── App.tsx                         # Root: auth check, setup redirect, router, layout
├── App.css
├── api/
│   └── client.ts                   # All fetch calls to the backend API
├── components/
│   ├── Breadcrumbs.tsx
│   ├── CalendarView.tsx            # Calendar grid of due dates
│   ├── EquipmentForm.tsx           # Shared create/edit form for equipment
│   ├── EquipmentList.tsx           # Table of equipment records
│   ├── Footer.tsx
│   ├── Header.tsx                  # Nav bar with auth state
│   ├── ProcedureForm.tsx           # Shared create/edit form (includes EasyMDE)
│   ├── ProcedureList.tsx
│   ├── ThemeProvider.tsx           # next-themes wrapper
│   └── ThemeToggle.tsx             # Dark/light toggle
├── hooks/
│   └── useAuth.ts                  # AuthContext + hook
├── lib/
│   └── procedureUtils.ts           # calculateDueDetails() — mirrors backend DueDetails
├── pages/
│   ├── AboutPage.tsx
│   ├── ContactPage.tsx
│   ├── DashboardPage.tsx
│   ├── EditEquipmentPage.tsx
│   ├── EditProcedurePage.tsx
│   ├── EquipmentPage.tsx
│   ├── EquipmentShowPage.tsx
│   ├── HomePage.tsx
│   ├── ImportEquipmentPage.tsx
│   ├── LoginPage.tsx
│   ├── NewEquipmentPage.tsx
│   ├── NewProcedurePage.tsx
│   ├── PerformProcedurePage.tsx
│   ├── ProcedureHistoryPage.tsx
│   ├── ProcedureShowPage.tsx
│   └── SetupPage.tsx
└── types/
    ├── equipment.ts
    └── procedure.ts
```

### 5.2 Routing

Defined in `App.tsx` using React Router 7. All protected routes redirect to `/login` when unauthenticated. Login
redirects to `/setup` when `setupRequired` is true.

| Path                                             | Component              | Auth Required                                                                  |
|--------------------------------------------------|------------------------|--------------------------------------------------------------------------------|
| `/`                                              | `HomePage`             | No                                                                             |
| `/login`                                         | `LoginPage`            | No (redirects to `/setup` if setup required)                                   |
| `/setup`                                         | `SetupPage`            | No (redirects to `/login` if already set up, or `/dashboard` if authenticated) |
| `/dashboard`                                     | `DashboardPage`        | Yes                                                                            |
| `/equipment`                                     | `EquipmentPage`        | Yes                                                                            |
| `/equipment/new`                                 | `NewEquipmentPage`     | Yes                                                                            |
| `/equipment/import`                              | `ImportEquipmentPage`  | Yes                                                                            |
| `/equipment/:id`                                 | `EquipmentShowPage`    | Yes                                                                            |
| `/equipment/:id/edit`                            | `EditEquipmentPage`    | Yes                                                                            |
| `/equipment/:id/procedures`                      | `ProceduresPage`       | Yes                                                                            |
| `/equipment/:id/procedures/new`                  | `NewProcedurePage`     | Yes                                                                            |
| `/equipment/:id/procedures/:procedureId`         | `ProcedureShowPage`    | Yes                                                                            |
| `/equipment/:id/procedures/:procedureId/edit`    | `EditProcedurePage`    | Yes                                                                            |
| `/equipment/:id/procedures/:procedureId/perform` | `PerformProcedurePage` | Yes                                                                            |
| `/equipment/:id/procedures/:procedureId/history` | `ProcedureHistoryPage` | Yes                                                                            |
| `/about`                                         | `AboutPage`            | No                                                                             |
| `/contact`                                       | `ContactPage`          | No                                                                             |

**Layout:** Authenticated pages wrap content in a `<Layout>` component that renders `<Header>`, `<Breadcrumbs>`,
`<main>`, and `<Footer>`.

**Auth state** is held in `AuthContext` (email string or null). On app load, `getMe()` and `getSetupStatus()` are called
in parallel; the app renders nothing (`null`) until both resolve.

Any API 401 response in `client.ts` redirects the browser to `/login`.

### 5.3 API Client

`frontend/src/api/client.ts` — all calls use `credentials: 'include'` so cookies are sent.

| Export               | Method | Path                            | Description                       |
|----------------------|--------|---------------------------------|-----------------------------------|
| `login`              | POST   | `/api/auth/login`               | Returns raw `Response`            |
| `logout`             | POST   | `/api/auth/logout`              |                                   |
| `getMe`              | GET    | `/api/auth/me`                  | Returns `{email, role}`           |
| `getSetupStatus`     | GET    | `/api/setup/status`             | Returns `{setupRequired}`         |
| `setupAdmin`         | POST   | `/api/setup`                    | Returns raw `Response`            |
| `fetchEquipment`     | GET    | `/api/equipment`                | Returns `Equipment[]`             |
| `getEquipment`       | GET    | `/api/equipment/:id`            | Returns `Equipment`               |
| `addEquipment`       | POST   | `/api/equipment`                | Returns `Equipment`               |
| `updateEquipment`    | PUT    | `/api/equipment/:id`            | Returns `Equipment`               |
| `deleteEquipment`    | DELETE | `/api/equipment/:id`            |                                   |
| `importEquipment`    | POST   | `/api/equipment/import`         | Multipart; returns `ImportResult` |
| `fetchProcedures`    | GET    | `/api/equipment/:id/procedures` | Returns `Procedure[]`             |
| `getProcedure`       | GET    | `…/procedures/:pid`             | Returns `Procedure`               |
| `addProcedure`       | POST   | `…/procedures`                  | Returns `Procedure`               |
| `updateProcedure`    | PUT    | `…/procedures/:pid`             | Returns `Procedure`               |
| `deleteProcedure`    | DELETE | `…/procedures/:pid`             |                                   |
| `recordPerformance`  | POST   | `…/procedures/:pid/history`     | Returns `Perform`                 |
| `sendDashboardEmail` | POST   | `/api/email/dashboard`          | Returns `{success}` or `{error}`  |

### 5.4 TypeScript Types

**`types/equipment.ts`**

```typescript
type EquipmentStatus = 'Active' | 'In Use' | 'Under Repair' | 'Decommissioned' | 'In Storage';

interface Equipment {
    id: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber?: string;
    assetTag?: string;
    location?: string;
    status: EquipmentStatus;
    description?: string;
    purchaseDate: string;       // ISO date string
    procedures?: Procedure[];
}

interface ImportResult {
    equipmentImported: number;
    proceduresImported: number;
    historyImported: number;
}
```

**`types/procedure.ts`**

```typescript
interface Perform {
    id: string;
    date: string;               // ISO date string
    notes: string;
}

interface Procedure {
    id: string;
    name: string;
    description?: string;
    steps: string;              // Markdown
    requiredTools?: string;
    intervalDays: number;
    history?: Perform[];
}
```

### 5.5 Key Components & Pages

#### `DashboardPage`

- Fetches all equipment via `fetchEquipment()`.
- Flattens equipment → procedures → `calculateDueDetails()` into a list of dashboard items.
- Two views switchable by the user (preference persisted in `localStorage`):
    - **List view:** sortable, searchable table; overdue rows highlighted in red.
    - **Calendar view:** grid of days with procedure due dates marked; overdue items in red; clickable to navigate to
      the procedure.
- Manual "Send Dashboard Email" button (ADMIN only) calls `sendDashboardEmail()`.
- Items sorted by days-till-due ascending (most overdue first).

#### `EquipmentForm`

Shared by `NewEquipmentPage` and `EditEquipmentPage`. Fields:

- Manufacturer (text, required)
- Model Number (text, required)
- Serial Number (text)
- Asset Tag (text)
- Location (text)
- Status (dropdown: Active, In Use, Under Repair, Decommissioned, In Storage)
- Description (textarea)
- Purchase Date (date picker)

#### `ProcedureForm`

Shared by `NewProcedurePage` and `EditProcedurePage`. Fields:

- Name (text, required)
- Description (textarea)
- Steps (EasyMDE markdown editor)
- Required Tools (textarea)
- Interval Days (number, required)

#### `ProcedureShowPage`

Displays procedure details. Renders `steps` as Markdown via `react-markdown`. Shows last-performed date and
days-till-due. Links to Perform and History sub-pages.

#### `ImportEquipmentPage`

File upload form. Accepts `.json` files. On submit, calls `importEquipment()` and displays counts from `ImportResult`.

#### `CalendarView`

Renders a month grid. Each cell shows procedure names due on that date. Overdue cells use red styling. Clicking a
procedure navigates to its detail page.

---

## 6. Deployment

### 6.1 Environment Variables

All configurable via `.env` in the `deployment/` directory (see `.env.example`):

| Variable                        | Description                                                |
|---------------------------------|------------------------------------------------------------|
| `POSTGRES_DB`                   | Full JDBC URL: `jdbc:postgresql://postgres:5432/equipment` |
| `POSTGRES_USER`                 | PostgreSQL username                                        |
| `POSTGRES_PASSWORD`             | PostgreSQL password                                        |
| `PGDATA`                        | PostgreSQL data directory inside container                 |
| `SPRING_MAIL_USERNAME`          | Gmail address for SMTP                                     |
| `SPRING_MAIL_PASSWORD`          | Gmail app password                                         |
| `APP_SMTP_FROM`                 | From address for outbound emails                           |
| `APP_URL`                       | Public HTTPS URL (used in email links)                     |
| `APP_JWT_SECRET`                | Base64-encoded random secret (`openssl rand -base64 48`)   |
| `APP_JWT_EXPIRATION_MS`         | Access token TTL in ms (default `3600000` = 1 hour)        |
| `APP_COOKIE_SECURE`             | `true` for HTTPS production, `false` for local dev         |
| `APP_LOGIN_MAX_ATTEMPTS`        | Failed login threshold before lockout (default `5`)        |
| `APP_LOGIN_LOCKOUT_DURATION_MS` | Lockout window in ms (default `900000` = 15 min)           |
| `CADDY_DOMAIN`                  | Domain for Caddy's automatic TLS certificate               |
| `CADDY_EMAIL`                   | Email for Let's Encrypt registration                       |

### 6.2 Docker Compose (Production)

`deployment/docker-compose.yml` — four services, all `restart: unless-stopped`, structured JSON logging (10 MB max, 3
files):

| Service    | Image                                 | Port             | Notes                                                                      |
|------------|---------------------------------------|------------------|----------------------------------------------------------------------------|
| `postgres` | `postgres:18`                         | `127.0.0.1:5432` | Data volume: `./postgres-data`                                             |
| `backend`  | `paulwoods/equipment-backend:latest`  | Internal only    | Depends on `postgres`                                                      |
| `frontend` | `paulwoods/equipment-frontend:latest` | Internal only    | Depends on `backend`                                                       |
| `caddy`    | `caddy:2-alpine`                      | `80`, `443`      | Depends on `frontend` + `backend`; volumes for Caddyfile, TLS data, config |

### 6.3 Caddy (Reverse Proxy / TLS)

`deployment/Caddyfile`:

```
{
    email mr.paul.woods@gmail.com
}

mrpaulwoods.com {
    encode zstd gzip

    handle /api/* {
        reverse_proxy backend:8080
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

- Automatic HTTPS via Let's Encrypt.
- `/api/*` proxied to the Spring Boot backend on port 8080.
- All other requests proxied to the React static file server (nginx) on port 80.
- Response compression: zstd and gzip.

### 6.4 Local Development

`docker-compose.yml` (project root) runs PostgreSQL only:

```yaml
services:
  postgres:
    image: postgres:18
    ports:
      - "5432:5432"
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: pg_isready
```

Run the backend and frontend separately:

```bash
# Terminal 1 — backend
cd backend && ./mvnw spring-boot:run

# Terminal 2 — frontend
cd frontend && npm run dev
```

The Vite dev server proxies `/api/*` to `localhost:8080` (configured in `vite.config.ts`).

---

## 7. Testing

### Backend

- **Unit tests** (`*Test.java`): JUnit 5 + Mockito. Use `@ExtendWith(MockitoExtension.class)`. Controller tests use
  `MockMvcBuilders.standaloneSetup()` (no `@WebMvcTest`). No `@SpringBootTest`.
- **Integration tests** (`*IT.java`): `@SpringBootTest`. Run separately via Maven Failsafe plugin.
- **Run unit tests:** `./mvnw clean test`
- **Run integration tests:** `./mvnw verify`

### Frontend

- **Unit tests:** Vitest + `@testing-library/react` + `@testing-library/jest-dom`.
- **Run tests:** `npm run test`
- **Watch mode:** `npm run test:watch`
- **Lint:** `npm run lint` (ESLint with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`)
- **Type check / build:** `npm run build` (runs `tsc -b` then Vite build)
