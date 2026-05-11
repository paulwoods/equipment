# Equipment

A self-hosted maintenance tracking application for physical assets. Equipment lets you define an inventory of items, attach recurring maintenance procedures to each one, and log when those procedures are performed — so nothing falls through the cracks.

## Features

- **Equipment inventory** — track manufacturer, model, serial number, location, and status for each asset
- **Maintenance procedures** — define what needs to be done, how often, and what tools are required (Markdown-supported descriptions)
- **Execution history** — record when a procedure was completed, with optional notes
- **Weekly email digest** — a summary of overdue and upcoming maintenance sent every Saturday morning
- **Role-based access** — four roles (SYSTEM_ADMIN, ADMIN, EDIT, USER) control what each person can do
- **Light / dark mode**

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2

### 1. Clone and configure

```bash
git clone https://github.com/paulwoods/equipment.git
cd equipment/deployment
cp ../.env.example .env
```

Open `.env` and fill in the required values (see [Configuration](#configuration) below). At minimum you must set:

- `APP_JWT_SECRET` — generate with `openssl rand -base64 48`
- `POSTGRES_PASSWORD`
- `CADDY_DOMAIN` and `CADDY_EMAIL` — your server's domain and an email for Let's Encrypt
- SMTP credentials if you want the weekly email digest

### 2. Start the stack

```bash
docker compose up -d
```

This starts four containers: PostgreSQL, the Spring Boot backend, the React frontend, and Caddy (reverse proxy + TLS).

### 3. First-run setup

Navigate to `https://<your-domain>/setup` in a browser. You will be prompted to create the initial administrator account. This endpoint is only available until the first admin is created.

---

## Configuration

All configuration is supplied via environment variables in `.env`.

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | PostgreSQL database name | `equipment` |
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | *(required)* |
| `SPRING_DATASOURCE_URL` | JDBC connection URL | `jdbc:postgresql://postgres:5432/equipment` |
| `SPRING_MAIL_USERNAME` | SMTP account username | *(required for email)* |
| `SPRING_MAIL_PASSWORD` | SMTP account password | *(required for email)* |
| `APP_SMTP_FROM` | From address on outgoing emails | *(required for email)* |
| `APP_URL` | Public base URL of the application (e.g. `https://equipment.example.com`) | *(required)* |
| `APP_JWT_SECRET` | HS256 signing secret — must be ≥ 32 bytes | *(required)* |
| `APP_JWT_EXPIRATION_MS` | Access token lifetime in milliseconds | `3600000` (1 hour) |
| `APP_COOKIE_SECURE` | Set to `true` in production (requires HTTPS) | `false` |
| `APP_LOGIN_MAX_ATTEMPTS` | Failed login attempts before lockout (per IP) | `5` |
| `APP_LOGIN_LOCKOUT_DURATION_MS` | Lockout duration in milliseconds | `900000` (15 min) |
| `CADDY_DOMAIN` | Domain name for TLS certificate provisioning | *(required)* |
| `CADDY_EMAIL` | Email for Let's Encrypt notifications | *(required)* |

To disable the weekly email scheduler entirely, add `scheduling.enabled=false` to your backend's Spring properties.

---

## Using the Application

### Equipment

The **Equipment** list is the home screen. Each card shows the asset's name, location, and status.

**To add equipment:**
1. Click **Add Equipment**
2. Fill in name, manufacturer, model, serial number, location, and status
3. Click **Save**

**Status values:** Active, Inactive, Retired

**To edit or delete** an item, open it and use the Edit / Delete controls on the detail page.

### Maintenance Procedures

Each piece of equipment can have one or more maintenance procedures — recurring tasks like "Clean the fans" or "Change the filter."

**To add a procedure:**
1. Open an equipment item
2. Click **Add Procedure**
3. Enter the name, a description (Markdown supported), the interval (e.g. every 90 days), and any required tools
4. Click **Save**

The procedure card shows when it is next due based on the last recorded execution.

### Logging Maintenance

When a procedure is performed, record it so the schedule stays accurate.

**To log an execution:**
1. Open the equipment item and find the procedure
2. Click **Log Execution**
3. Select the date and add optional notes
4. Click **Save**

The procedure's "last performed" date updates immediately and the next-due date recalculates.

### User Management

Users with the **ADMIN** or **SYSTEM_ADMIN** role can manage other accounts from the **Users** section.

**Roles and capabilities:**

| Role | View equipment | Edit equipment | Manage users | System settings |
|---|---|---|---|---|
| USER | ✓ | | | |
| EDIT | ✓ | ✓ | | |
| ADMIN | ✓ | ✓ | ✓ | |
| SYSTEM_ADMIN | ✓ | ✓ | ✓ | ✓ |

**To invite a user**, enter their email address and assign a role. They will receive an email with a link to set their password.

---

## Email Notifications

A weekly digest is sent every **Saturday at 7:00 AM Central Time** to all users. It lists:

- Procedures that are **overdue**
- Procedures **coming due** in the next week

SMTP must be configured (see `SPRING_MAIL_*` variables above). If the email send fails in a given week, the error is logged and the next week's run is unaffected.

---

## Development Setup

### Prerequisites

- Java 25+
- Node.js 22+
- PostgreSQL 18

### Backend

```bash
cd equipment-backend
cp ../.env.example .env          # configure local database and JWT secret
./mvnw spring-boot:run
```

The API is available at `http://localhost:8080/api/v1`.

### Frontend

```bash
cd equipment-frontend
npm install
npm run dev
```

The dev server is available at `http://localhost:5173` and proxies API requests to the backend.

### E2E Tests

```bash
cd equipment-e2e
npm install
npx playwright test
```

---

## Deployment Operations

All scripts live in `deployment/`.

| Script | Usage | Description |
|---|---|---|
| `deploy.sh` | `./deploy.sh <version> <version>` | Pin new image tags and restart the stack |
| `backup.sh` | `./backup.sh` | Dump the PostgreSQL database with retention |
| `restart.sh` | `./restart.sh` | Restart all Docker Compose services |
| `sql.sh` | `./sql.sh "<query>"` | Run a SQL query against the running database |

**Example — upgrade to a new release:**

```bash
cd deployment
./deploy.sh 2.1.0 2.1.0
```

---

## Architecture

```
Browser
  └─ Caddy (TLS, reverse proxy)
       ├─ /api/**  →  Spring Boot backend (port 8080)
       └─ /**      →  React SPA (port 80)
                        PostgreSQL 18
```

The backend and frontend are versioned together and released as a matched pair. See `docs/adr/` for the architectural decision records that explain the key design choices.

---

## License

See [LICENSE](LICENSE).
