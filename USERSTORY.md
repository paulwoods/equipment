# Equipment Maintenance Management System — User Stories

---

## Roles

| Role      | Description                                                                                                     |
|-----------|-----------------------------------------------------------------------------------------------------------------|
| **ADMIN** | Manages all data: creates/edits/deletes equipment, procedures, and users; triggers email reports; runs imports. |
| **USER**  | Views equipment and procedures; records procedure execution history.                                            |

---

## Epics

1. [Application Setup](#1-application-setup)
2. [Authentication](#2-authentication)
3. [Equipment Management](#3-equipment-management)
4. [Procedure Management](#4-procedure-management)
5. [Procedure Execution & History](#5-procedure-execution--history)
6. [Dashboard & Reporting](#6-dashboard--reporting)
7. [Email Notifications](#7-email-notifications)
8. [Bulk Import](#8-bulk-import)

---

## 1. Application Setup

### US-001 — Initial Admin Setup

**As a** first-time deployer,  
**I want to** create the initial administrator account through a setup screen,  
**so that** the application is secured from the start and I can begin managing equipment.

**Acceptance Criteria:**

- When no users exist in the system, navigating to `/login` automatically redirects to `/setup`.
- The setup screen accepts an email address and password.
- Submitting the form creates the first user with the ADMIN role.
- After successful setup, the user is logged in and redirected to the dashboard.
- Once an admin account exists, the `/setup` route redirects to `/login` and cannot be used again.

---

### US-002 — Setup Status Check

**As the** application,  
**I want to** detect whether initial setup has been completed,  
**so that** users are directed to the appropriate starting page (setup vs. login).

**Acceptance Criteria:**

- `GET /api/setup/status` returns `{"setupRequired": true}` when no users exist.
- `GET /api/setup/status` returns `{"setupRequired": false}` when at least one user exists.
- The frontend checks this on every page load before rendering any content.

---

## 2. Authentication

### US-003 — Login

**As a** registered user,  
**I want to** log in with my email and password,  
**so that** I can access the application.

**Acceptance Criteria:**

- The login form accepts email and password.
- On success, the user is redirected to the dashboard.
- Auth tokens are stored in httpOnly cookies (not accessible to JavaScript).
- The access token expires after 1 hour.
- Invalid credentials show an error message.

---

### US-004 — Login Rate Limiting

**As the** system,  
**I want to** limit repeated failed login attempts,  
**so that** the application is protected against brute-force attacks.

**Acceptance Criteria:**

- After 5 failed login attempts from the same IP + email combination, further attempts are blocked for 15 minutes.
- Blocked attempts receive an HTTP 429 response.
- A successful login resets the failed attempt counter.
- Thresholds are configurable via environment variables.

---

### US-005 — Session Persistence (Token Refresh)

**As a** logged-in user,  
**I want to** remain authenticated across browser sessions without logging in every hour,  
**so that** my workflow is not interrupted.

**Acceptance Criteria:**

- A refresh token (valid for 7 days) is issued alongside the short-lived access token.
- When the access token expires, the client transparently exchanges the refresh token for a new access token and refresh
  token.
- The old refresh token is deleted on rotation (single-use).
- If the refresh token is expired or invalid, the user is redirected to login.

---

### US-006 — Logout

**As a** logged-in user,  
**I want to** log out of the application,  
**so that** my session is terminated and my account is secure.

**Acceptance Criteria:**

- Clicking logout sends a request that deletes the refresh token from the database.
- Both the `access_token` and `refresh_token` cookies are cleared.
- The user is redirected to the login page.

---

### US-007 — Unauthenticated Redirect

**As a** visitor without a valid session,  
**I want to** be redirected to the login page when I access a protected route,  
**so that** I know I need to authenticate.

**Acceptance Criteria:**

- Accessing any protected route (e.g., `/dashboard`, `/equipment`) without a valid session redirects to `/login`.
- Any API call that receives a 401 response causes the browser to redirect to `/login`.

---

## 3. Equipment Management

### US-008 — View Equipment List

**As a** user,  
**I want to** see a list of all equipment,  
**so that** I can browse the inventory.

**Acceptance Criteria:**

- `/equipment` displays all equipment records.
- Each item shows key identifiers (manufacturer, model number, status, location).
- The list is accessible to both ADMIN and USER roles.

---

### US-009 — View Equipment Detail

**As a** user,  
**I want to** view the full details of a single piece of equipment,  
**so that** I can see all its attributes and navigate to its procedures.

**Acceptance Criteria:**

- `/equipment/:id` displays all fields: manufacturer, model number, serial number, asset tag, location, status,
  description, and purchase date.
- The page links to the equipment's procedures.
- Accessible to both ADMIN and USER roles.

---

### US-010 — Create Equipment

**As an** admin,  
**I want to** add a new piece of equipment to the inventory,  
**so that** I can track its maintenance.

**Acceptance Criteria:**

- `/equipment/new` presents a form with fields: manufacturer (required), model number (required), serial number, asset
  tag, location, status (dropdown), description, purchase date.
- Status options: Active, In Use, Under Repair, Decommissioned, In Storage.
- On success, the new equipment appears in the inventory list.
- Only ADMIN users can access this form; USER role receives a 403.

---

### US-011 — Edit Equipment

**As an** admin,  
**I want to** update the details of an existing piece of equipment,  
**so that** the inventory stays accurate.

**Acceptance Criteria:**

- `/equipment/:id/edit` pre-fills all fields with the current values.
- Submitting saves the changes and reflects them immediately.
- Only ADMIN users can edit equipment.

---

### US-012 — Delete Equipment

**As an** admin,  
**I want to** remove a piece of equipment from the inventory,  
**so that** decommissioned or sold assets are no longer tracked.

**Acceptance Criteria:**

- Deleting equipment also deletes all associated procedures and their execution history.
- The equipment no longer appears in the inventory list.
- Only ADMIN users can delete equipment.

---

### US-013 — Equipment Status Tracking

**As an** admin,  
**I want to** assign a status to each piece of equipment,  
**so that** I know whether it is available, in use, under repair, decommissioned, or in storage.

**Acceptance Criteria:**

- Status is one of: Active, In Use, Under Repair, Decommissioned, In Storage.
- Status is displayed in the equipment list and detail views.
- Status can be changed at any time via the edit form.

---

## 4. Procedure Management

### US-014 — View Procedures for Equipment

**As a** user,  
**I want to** see all maintenance procedures defined for a piece of equipment,  
**so that** I know what tasks need to be performed.

**Acceptance Criteria:**

- `/equipment/:id/procedures` lists all procedures for that equipment.
- Each procedure shows its name and maintenance interval.
- Accessible to both ADMIN and USER roles.

---

### US-015 — View Procedure Detail

**As a** user,  
**I want to** see the full details of a maintenance procedure,  
**so that** I know exactly how to perform it.

**Acceptance Criteria:**

- `/equipment/:id/procedures/:procedureId` displays: name, description, step-by-step instructions (rendered as
  Markdown), required tools, and interval.
- The page shows the last-performed date and days-till-due.
- Links to perform the procedure and view history.
- Accessible to both ADMIN and USER roles.

---

### US-016 — Create Procedure

**As an** admin,  
**I want to** define a maintenance procedure for a piece of equipment,  
**so that** users know what tasks are required and how often to perform them.

**Acceptance Criteria:**

- `/equipment/:id/procedures/new` presents a form with: name (required), description, steps (Markdown editor), required
  tools, and interval in days (required).
- On success, the procedure appears in the equipment's procedure list.
- Only ADMIN users can create procedures.

---

### US-017 — Edit Procedure

**As an** admin,  
**I want to** update a maintenance procedure,  
**so that** instructions and intervals remain accurate.

**Acceptance Criteria:**

- `/equipment/:id/procedures/:procedureId/edit` pre-fills all fields.
- Submitting saves changes immediately.
- Only ADMIN users can edit procedures.

---

### US-018 — Delete Procedure

**As an** admin,  
**I want to** remove a maintenance procedure,  
**so that** obsolete tasks are no longer tracked.

**Acceptance Criteria:**

- Deleting a procedure also deletes all of its execution history records.
- The procedure no longer appears in the equipment's procedure list.
- Only ADMIN users can delete procedures.

---

### US-019 — Markdown Procedure Steps

**As an** admin,  
**I want to** write procedure steps using Markdown,  
**so that** I can format instructions clearly with headings, lists, and emphasis.

**Acceptance Criteria:**

- The steps field uses an interactive Markdown editor (EasyMDE) during create/edit.
- The procedure detail view renders Markdown as formatted HTML.

---

## 5. Procedure Execution & History

### US-020 — Record Procedure Execution

**As a** user,  
**I want to** record that I performed a maintenance procedure,  
**so that** the system knows when it was last done and can calculate the next due date.

**Acceptance Criteria:**

- `/equipment/:id/procedures/:procedureId/perform` presents a form with: date (required) and notes.
- Submitting creates a history record and updates the due date calculation.
- Accessible to both ADMIN and USER roles.

---

### US-021 — View Procedure Execution History

**As a** user,  
**I want to** see the history of when a procedure has been performed,  
**so that** I can review past maintenance activity.

**Acceptance Criteria:**

- `/equipment/:id/procedures/:procedureId/history` lists all execution records in reverse chronological order.
- Each record shows the date and any notes recorded.
- Accessible to both ADMIN and USER roles.

---

### US-022 — Due Date Calculation

**As a** user,  
**I want the** system to automatically calculate when each procedure is next due,  
**so that** I don't need to track this manually.

**Acceptance Criteria:**

- Due date = date of last execution + interval days.
- Days till due = interval days − days since last execution.
- If days till due ≤ 0, the procedure is marked **OVERDUE**.
- If days till due > 0, the procedure is marked **Upcoming**.
- Procedures with no execution history have no due date displayed.

---

## 6. Dashboard & Reporting

### US-023 — View Maintenance Dashboard

**As a** user,  
**I want to** see a single view of all maintenance procedures across all equipment, sorted by urgency,  
**so that** I can quickly identify what needs attention.

**Acceptance Criteria:**

- `/dashboard` lists every procedure for every piece of equipment in a flat list.
- Items are sorted by days-till-due ascending (most overdue first, then soonest upcoming).
- Each row shows: equipment name, procedure name, interval, days till due, due date, and status.
- Overdue items are visually highlighted (red).
- Procedures with no history are shown but without a due date.

---

### US-024 — Search and Filter Dashboard

**As a** user,  
**I want to** search the dashboard list,  
**so that** I can quickly find procedures for a specific piece of equipment.

**Acceptance Criteria:**

- A search/filter input narrows the displayed list by equipment name or procedure name.
- Filtering is applied client-side with no page reload.

---

### US-025 — Calendar View of Due Dates

**As a** user,  
**I want to** view upcoming maintenance due dates on a calendar,  
**so that** I can plan maintenance work across days and weeks.

**Acceptance Criteria:**

- The dashboard offers a calendar view toggle alongside the list view.
- Each day cell shows the names of procedures due on that date.
- Overdue items appear in red.
- Clicking a procedure on the calendar navigates to its detail page.
- The selected view (list vs. calendar) is remembered across page reloads (localStorage).

---

### US-026 — Navigate from Dashboard to Procedure

**As a** user,  
**I want to** click a procedure on the dashboard and go directly to its detail page,  
**so that** I can read the instructions and record execution without navigating manually.

**Acceptance Criteria:**

- Each dashboard item (in both list and calendar views) links directly to the corresponding procedure detail page.

---

## 7. Email Notifications

### US-027 — Scheduled Weekly Maintenance Report

**As an** admin,  
**I want to** receive an automated weekly email summarizing the maintenance status of all procedures,  
**so that** I stay informed without having to log into the application.

**Acceptance Criteria:**

- The system automatically sends a dashboard email every Saturday at 7:00 AM Central Time.
- The email contains an HTML table with: equipment name, procedure name, interval, days till due, due date, and status.
- Overdue items are visually distinguished in the email.
- The scheduler can be disabled via configuration (`scheduling.enabled=false`).

---

### US-028 — Manual Dashboard Email Trigger

**As an** admin,  
**I want to** manually send the maintenance dashboard email on demand,  
**so that** I can share the current status with stakeholders at any time.

**Acceptance Criteria:**

- The dashboard page includes a "Send Dashboard Email" button visible to ADMIN users only.
- Clicking the button triggers an immediate send of the dashboard email.
- The UI confirms success or displays an error message if the send fails.
- Only ADMIN role can trigger the email send.

---

## 8. Bulk Import

### US-029 — Import Equipment from JSON File

**As an** admin,  
**I want to** upload a JSON file to bulk-create equipment, procedures, and history records,  
**so that** I can populate the system quickly without entering each item manually.

**Acceptance Criteria:**

- `/equipment/import` presents a file upload form accepting `.json` files.
- The JSON file is an array of equipment objects, each optionally containing nested procedures and history records.
- On success, the UI displays counts: equipment imported, procedures imported, history records imported.
- The entire import is atomic — if any item fails, nothing is committed.
- An error message is displayed if the file is empty or contains invalid JSON.
- Only ADMIN users can access the import feature.

**Expected JSON structure:**

```json
[
  {
    "manufacturer": "Acme",
    "modelNumber": "X-100",
    "status": "Active",
    "procedures": [
      {
        "name": "Oil Change",
        "intervalDays": 90,
        "history": [
          {
            "date": "2025-01-15",
            "notes": "Used synthetic oil."
          }
        ]
      }
    ]
  }
]
```

---

## Appendix — Role Permission Matrix

| Feature                    |        ADMIN        | USER |
|----------------------------|:-------------------:|:----:|
| View equipment list        |          ✓          |  ✓   |
| View equipment detail      |          ✓          |  ✓   |
| Create equipment           |          ✓          |  —   |
| Edit equipment             |          ✓          |  —   |
| Delete equipment           |          ✓          |  —   |
| View procedures            |          ✓          |  ✓   |
| View procedure detail      |          ✓          |  ✓   |
| Create procedure           |          ✓          |  —   |
| Edit procedure             |          ✓          |  —   |
| Delete procedure           |          ✓          |  —   |
| Record procedure execution |          ✓          |  ✓   |
| View execution history     |          ✓          |  ✓   |
| View dashboard             |          ✓          |  ✓   |
| Send dashboard email       |          ✓          |  —   |
| Bulk import                |          ✓          |  —   |
| Initial setup              | ✓ (first user only) |  —   |
