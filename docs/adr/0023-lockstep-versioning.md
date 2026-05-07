# 23. Lock-step versioning of backend and frontend artifacts

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-05-06

## Context

A two-tier project (Spring Boot API + React SPA) can release on two
different schedules:

1. **Independent versioning** — each tier has its own version, and
   a compatibility matrix records which backend works with which
   frontend.
2. **Lock-step versioning** — both tiers share a single version, and
   they are always released together.

The compatibility-matrix approach scales to many clients but adds
ongoing maintenance: every PR has to consider whether it bumps the
matrix. The lock-step approach forfeits independent shipping in
exchange for "what's deployed is what's in the tag."

## Decision

Both backend and frontend share **the same version string**:

- `backend/pom.xml` → `<version>2.0.22</version>`
- `frontend/package.json` → `"version": "2.0.22"`
- The `e2e` package (`e2e/package.json` at `1.0.0`) is intentionally
  *not* in lock-step — its version reflects the test harness, not
  the system under test.

The version is exposed at runtime through `GET /api/v1/version`
(`VersionController` reads Spring's `BuildProperties`), giving the
SPA and operators a single source of truth for "what's deployed."

Releases are bumped through `deployment/deploy.sh`:

```sh
./deploy.sh 2.0.23 2.0.23
```

The script *accepts two arguments* (backend tag, frontend tag) and
does not enforce that they match. This is intentional flexibility for
the "ship a frontend-only hotfix" case, but the convention is that
they match for any normal release.

## Consequences

- **Positive:** "what version is in production?" has one answer.
  Bug reports, audit logs, and client-side error messages can refer
  to a single version number.
- **Positive:** the deploy script is dead simple — bump two image
  tags, pull, up. No matrix lookup, no compatibility check.
- **Positive:** because nothing ever runs at mismatched versions in
  practice, the API contract between SPA and backend doesn't need a
  formal versioning regime. Breaking changes can be made in lockstep.
- **Negative:** a frontend-only typo fix still bumps the backend
  version (or, if you use the deploy script's flexibility to ship
  mismatched tags, you've quietly created the matrix you said you
  didn't want).
- **Negative:** there is no automated guard preventing the two
  versions from diverging. A `pre-commit` or CI check that asserts
  `pom.xml` and `frontend/package.json` versions match would harden
  the convention; not currently in place.
- **Negative:** the lock-step convention is implicit. A new
  contributor who bumps only one side will not be told they did
  something wrong by the tooling — only by code review.
