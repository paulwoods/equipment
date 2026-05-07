# 14. Spring `@Scheduled` for weekly dashboard email

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

The application sends a weekly maintenance dashboard email (overdue
procedures, upcoming work) to a configured recipient. The cadence is
fixed and the work is small (a single SMTP send), so a full job scheduler
would be overkill.

## Decision

Use Spring's built-in `@Scheduled` with cron syntax:

- `MaintenanceScheduler.sendWeeklyDashboardEmail` runs at
  `0 0 7 * * SAT` in `America/Chicago` — handles CST/CDT automatically.
- Gated by `@ConditionalOnProperty(name = "scheduling.enabled",
  havingValue = "true", matchIfMissing = true)` so tests and CI can
  disable it via property override.
- Failures are caught and logged; the next week's run is unaffected.
- SMTP credentials come from `SPRING_MAIL_USERNAME` /
  `SPRING_MAIL_PASSWORD`, recipient from `app.email-recipient`, sender
  from `app.smtp-from`.

## Consequences

- **Positive:** zero new infrastructure — runs in the backend container.
- **Positive:** `Scheduled` is dead-simple and the cron expression makes
  the cadence obvious.
- **Negative:** if the deployment is ever scaled to multiple replicas, every
  replica sends the email. Either add `@SchedulerLock` (ShedLock) or
  designate a "leader" replica via env var. Not an issue at current scale.
- **Negative:** missed runs (host down at 7 AM Saturday) are not retried
  — the email simply doesn't go out that week. Acceptable.
