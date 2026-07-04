# 27. Split the monorepo into a superproject with git submodules

- **Status:** Accepted (reverse-engineered)
- **Date:** 2026-07-03 (decision made 2026-05-07)
- **Related:** ADR-0023 (lock-step versioning), ADR-0025 (CI-managed release tags)

## Context

The project began as a single git repository containing the backend,
frontend, and e2e test suite as sibling directories. On 2026-05-07 the
repository was split into four repos: `equipment` (this superproject)
plus `equipment-backend`, `equipment-frontend`, and `equipment-e2e`,
wired back together as git submodules.

Plausible drivers, reconstructed from CI config and history:

- Each module has an independent CI pipeline (`publish.yml` per repo)
  that builds and tags its own container image; separate repos give
  each pipeline its own trigger scope without path filters.
- Backend and frontend version independently (`pom.xml` vs
  `package.json`) while ADR-0023 keeps releases lock-step; the
  superproject's submodule pointers are the mechanism that records
  "these exact commits ship together."

## Decision

Keep `equipment` as a thin superproject holding deployment assets
(`docker-compose.yml`, `deployment/`, `docs/adr/`) and three submodule
pointers. All application code lives in the sub-repositories. A change
that spans modules is committed in the affected sub-repo(s) first, then
the superproject commits the updated pointer(s) — making every
cross-module state a first-class, checkout-able commit.

## Consequences

- **Positive:** the superproject history is a ledger of known-good
  module combinations; `git checkout` of any superproject commit
  reproduces the exact trio that was deployed.
- **Positive:** per-module CI stays simple — no monorepo path
  filtering, no shared pipeline contention.
- **Negative:** every backend or frontend change is a two-commit
  ritual (sub-repo commit + pointer bump), and a forgotten bump leaves
  the superproject pointing at stale code with no error.
- **Negative:** contributors must know submodule mechanics
  (`--recurse-submodules`, detached HEADs inside modules); tooling that
  assumes one repo (code search, refactors across modules) gets harder.
- **Neutral:** ADRs live only in the superproject, so decisions about
  sub-repo code are recorded one level above the code they describe.
