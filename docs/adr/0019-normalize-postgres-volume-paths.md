# 19. Normalize Postgres data volume path across compose files

- **Status:** Accepted
- **Date:** 2026-05-06
- **Related:** ADR-0010 (Docker Compose deployment)

## Context

The repo previously shipped two Docker Compose files with **inconsistent
host bind mounts** for the Postgres data directory:

| File                              | Host path           |
|-----------------------------------|---------------------|
| `docker-compose.yml` (repo root)  | `./postgres_data`   |
| `deployment/docker-compose.yml`   | `./postgres-data`   |

The two paths differed only in `_` vs `-`. A stray `./postgres_data/`
directory existed at the repo root from a previous run (noted in
`deployment-hardening.md`).

This was a footgun:

- An operator who copied the repo to a host and ran *both* compose
  files (or the wrong one) got two different on-disk databases and
  confusion about which one was "real."
- Documentation written against one path was wrong for the other.
- Backup scripts (`deployment/backup.sh`) were tied to one path and
  silently missed data if pointed at the wrong tree.

## Decision

The canonical path is **`./postgres-data`** (the deployment file's
spelling, since that is the one that runs in production).

Applied:

1. Root `docker-compose.yml` Postgres volume changed to
   `./postgres-data:/var/lib/postgresql`.
2. Root `.gitignore` now contains `/postgres-data/` as the canonical
   ignore. The legacy `/postgres_data/` entry was retained as a
   transitional safeguard — the stray directory on disk is owned by
   `root` (Docker created it) and removing it requires `sudo`. Once
   it has been deleted on the operator's host, the legacy entry can
   be removed too.
3. Postgres' on-disk format is identical between the two paths; the
   only "data migration" for a developer with active local state is
   `sudo mv postgres_data postgres-data` (or `sudo rm -rf
   postgres_data` to discard).

## Consequences

- **Positive:** one path everywhere — backups, dev, prod, docs all
  match.
- **Positive:** removes a class of "why is my data missing?" support
  questions.
- **Negative:** developers with active local state need to rename the
  directory once; requires `sudo` because Docker's mount creates it
  with `root` ownership. One-time, low-risk.
- **Negative:** if anything outside the repo (an external backup cron,
  a host monitoring rule) was watching the underscore path, it must be
  updated. Unlikely but worth a grep on the host before rolling.

## Follow-up (operator action required)

Removing the stale `./postgres_data/` directory at the repo root, and
then dropping `/postgres_data/` from `.gitignore`, are operator-side
tasks (require `sudo` on the host running Docker). They are not part
of this ADR's automated change set.
