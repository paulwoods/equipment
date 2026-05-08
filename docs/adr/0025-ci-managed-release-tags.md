# 25. CI creates the git tag for every published image

- **Status:** Accepted
- **Date:** 2026-05-07
- **Related:** ADR-0023 (Lock-step versioning), ADR-0010 (Docker Compose deployment)

## Context

ADR-0023 establishes that backend and frontend share a single version
string carried in `backend/pom.xml` and `frontend/package.json`.
Historically, the corresponding `vX.Y.Z` git tag was created by hand
after a version-bump commit was pushed:

```sh
git tag v2.0.24
git push origin v2.0.24
```

That left two failure modes that don't surface until later:

1. **Forgotten tag.** Nothing in CI required the tag to exist, so it
   was easy to bump versions, ship images to Docker Hub, and never
   tag the source. `paulwoods/equipment-backend:2.0.24` would exist
   in the registry with no corresponding ref in the repo.
2. **Tag points at a broken commit.** When the publish workflow
   failed and the fix landed on a follow-up commit, the manually
   created tag was already pinned to the broken commit. The
   "successfully published 2.0.24" image and the "v2.0.24" git ref
   pointed at different SHAs (this happened on 2026-05-07 with the
   `.dockerignore` fix; the tag had to be force-moved).

Both modes degrade the value of the tag as an audit anchor: "what
source produced the running image?" stops having a reliable answer.

## Decision

The publish workflows (`publish-backend.yml`, `publish-frontend.yml`)
own git-tag creation. After a successful `docker buildx push` step,
each workflow:

1. Reads the version from the source of truth (`mvn help:evaluate`
   for backend, `package.json` for frontend).
2. Checks whether `vX.Y.Z` already exists; skips if so.
3. Otherwise creates a lightweight tag at `github.sha` and pushes
   it to `origin` using the default `GITHUB_TOKEN` with
   `permissions: contents: write`.

Consequences of this design:

- The skip-if-exists branch lets a single version-bump commit trigger
  both workflows concurrently without a race; whichever finishes
  first creates the tag, and the other no-ops.
- The tag is created **only after** image push succeeds, so a tag
  in the repo is evidence that an image with that version exists in
  the registry — the converse direction (image with no tag) is
  impossible under the new flow.
- Humans no longer create release tags. The `git tag vX.Y.Z` step
  in any operator runbook is obsolete and should be removed.

## Consequences

- **Positive:** "what source produced *the first* image at this
  version?" has a reliable answer — `git checkout vX.Y.Z` in the
  repo lines up with the original commit that published
  `paulwoods/equipment-{backend,frontend}:X.Y.Z`. See the **Update
  (2026-05-07)** section below for why this is narrower than it
  first appears.
- **Positive:** force-moving tags becomes unnecessary. If a publish
  fails, the tag is simply never created on the broken commit; the
  next push that includes the fix produces it.
- **Positive:** `permissions: contents: write` is scoped to the
  workflow's `GITHUB_TOKEN` — no PAT to manage, rotate, or leak.
- **Negative:** the workflow now needs `contents: write`, slightly
  widening the blast radius of a compromised third-party action in
  the publish pipeline. Mitigation: pin third-party actions to a
  specific SHA rather than a floating tag (not currently done).
- **Negative:** path-filtered triggers (`paths: [backend/**]`,
  `paths: [frontend/**]`) mean a workflow-only edit cannot retroactively
  produce a tag for a version already published — the tag is created
  by the *next* qualifying push. Acceptable, but worth knowing if
  we ever need to backfill tags for older versions.
- **Negative:** the lock-step convention from ADR-0023 is now
  enforced *implicitly* by the tag-existence check: the second
  workflow finds the tag already there and skips. If the two
  workflows ever ran with different version strings (e.g., a hotfix
  that bumped only one side), they would each create a distinct
  tag, and the lock-step invariant would silently break in the tag
  history without warning. A version-parity check at the start of
  both workflows would close this gap; not currently in place.

## Update (2026-05-07)

The original framing of this ADR claimed that `git checkout vX.Y.Z`
"lines up with `paulwoods/equipment-{backend,frontend}:X.Y.Z`."
Within the first day of the policy, three Dependabot PRs (#11, #12,
#13) made it clear that this is overstated.

What actually happens:

- The version-bump commit creates the `vX.Y.Z` git tag (idempotent
  skip protects against the second workflow recreating it).
- Subsequent commits on `develop` that don't bump the app version —
  Dependabot lockfile bumps, security patches, doc fixes inside
  `backend/**` or `frontend/**` — still trigger the publish workflow
  on path filter, which **rebuilds and pushes** the same registry
  tag `X.Y.Z` with new content. The git tag stays pinned to the
  original commit; the registry tag silently moves.
- Net result: `git checkout vX.Y.Z` produces the *first* tree at
  that version, not the bytes currently behind the registry tag.

This is acceptable for our threat model — registry tag mutability
is industry-normal — but the ADR should not promise byte-identity
when the implementation doesn't deliver it.

**Revised contract:**

| Reference                    | Mutability                                   | Use for                          |
|------------------------------|----------------------------------------------|----------------------------------|
| `vX.Y.Z` (git tag)           | Immutable; pinned to first commit at version | Reproducing the source baseline  |
| `X.Y.Z` (Docker tag)         | **Mutable** within the version line          | Pulling "latest patch of X.Y.Z"  |
| `sha-<short>` (Docker tag)   | Immutable; one per commit                    | Auditing exactly-this-image      |

**Operator guidance:** for incident-response audits ("what bytes
were running at 03:14 UTC?"), use the `sha-<short>` Docker tag
recorded in deployment logs, not `X.Y.Z`. Both backend and frontend
images already carry it via `type=sha,prefix=sha-,format=short` in
the `metadata-action` config.

**What this rules out:** chasing byte-identity by bumping `X.Y.Z`
on every Dependabot merge. That's a lot of version churn for
patches that don't change behavior, and the lock-step convention
from ADR-0023 would force coordinated bumps even when only one tier
moved. Not worth it.
