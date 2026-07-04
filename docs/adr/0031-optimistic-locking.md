# 31. Optimistic locking with `@Version` — concurrent edits fail with 409

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03 (decision made 2026-06-10)
- **Related:** ADR-0020 (RFC 7807 problem details), ADR-0021 (UUID primary keys)

## Context

`Equipment`, `Procedure`, and `User` are all editable through the UI
by multiple concurrent users. Without concurrency control, two people
editing the same record produces silent last-writer-wins: the second
save overwrites the first with no signal to either party. For
maintenance procedures — where the content is safety-relevant
step-by-step instructions (ADR-0022) — a silently lost edit is the
worst failure mode available.

`V9__add_version_columns.sql` states the intent in its own comment:

> Optimistic locking: @Version columns so concurrent edits fail with
> 409 instead of silently overwriting each other.

The alternatives: pessimistic locks (row locks held across user
think-time — unworkable for a web UI), or ignoring the problem (the
prior state).

## Decision

Add a `version BIGINT` column managed by JPA `@Version` to the three
user-editable entities (`Equipment`, `Procedure`, `User`). A stale
update throws `OptimisticLockingFailureException`, which
`GlobalExceptionHandler` surfaces as an HTTP 409 problem detail
(ADR-0020).

Append-only entities (`Perform` history rows, token tables) carry no
version column — they are never updated concurrently, only inserted
and deleted.

**Scope of the guarantee as implemented:** update endpoints
load-modify-save inside one transaction, and the request/response DTOs
do **not** carry the version field. The `@Version` check therefore
catches *concurrent requests* racing on the same row, but not the
longer read-edit-save cycle — two users who both opened the edit form
and saved a minute apart still get last-writer-wins, because each save
reads the then-current version. Closing that gap requires
round-tripping `version` through the DTOs and having clients send it
back on update.

## Consequences

- **Positive:** simultaneous writes can no longer interleave silently;
  the losing request gets a 409 instead of corrupting the row.
- **Positive:** zero lock contention — the check costs one column
  compare per UPDATE.
- **Negative:** the user-level lost-update problem (stale edit form)
  is *narrowed, not eliminated* — see scope note above. The column and
  the 409 pipeline are in place, so extending the DTOs is the cheap
  remaining step if form-level conflicts start to bite.
- **Negative:** conflict handling is pushed to the client: a 409 the
  frontend doesn't handle gracefully degrades into "my save failed,
  why?". The UX debt of merge/retry flows is accepted rather than
  solved.
