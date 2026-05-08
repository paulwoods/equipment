# Plan: Split equipment monorepo into 4 repos preserving git history

## Context

The repo at `/home/mrpaulwoods/IdeaProjects/equipment` is a monorepo (357 commits on `develop`) containing:

- `backend/` — Maven/Java backend
- `frontend/` — Tailwind v4 frontend
- `e2e/` — Playwright tests
- root-level glue: `docker-compose.yml`, `deployment/`, `.github/workflows/`, `equipment.json`, `data/`, `docs/`,
  `.env*`, etc.

Goal: split into four independent GitHub repositories — `equipment-backend`, `equipment-frontend`, `equipment-e2e`, and
`equipment` (orchestration/deployment shell) — **without losing git history** for any path.

The right tool is **`git filter-repo`** (https://github.com/newren/git-filter-repo). It is the official recommendation
from the Git project, replacing the deprecated `git filter-branch`. It rewrites history fast, preserves
authorship/dates, and supports path filtering with optional path renaming. Each split is done on a **fresh clone** so
the original repo is untouched.

Notes:

- `filter-repo` refuses to run on a non-fresh clone by default — that safety check is *the* reason to clone four times
  rather than reusing one working copy.
- Splitting creates 4 independent histories. Commits that touched multiple subtrees (e.g. a single commit touching both
  `backend/` and `frontend/`) will appear in *both* derived repos — the same SHA-derived commit, just with the
  irrelevant paths stripped. That's expected and not a bug.
- The `equipment` shell repo becomes orchestration-only: compose, deployment scripts, docs. Its CI workflows that build
  backend/frontend images move with the code they build.

## Decisions

- **Tags**: all tags propagated into every new repo.
- **Existing `paulwoods/equipment` repo**: rewritten in place and force-pushed (URL preserved).
- **Branches**: only `develop` is pushed to the new remotes.

## Prerequisites

1. Install `git-filter-repo`:
    - Arch: `sudo pacman -S git-filter-repo`
    - or: `pip install --user git-filter-repo`
2. Create the three new empty GitHub repos (no README/license/gitignore — must be empty so the push doesn't conflict):
    - `paulwoods/equipment-backend`
    - `paulwoods/equipment-frontend`
    - `paulwoods/equipment-e2e`
3. Pick a working directory for the splits, e.g. `~/IdeaProjects/split-work/`.
4. Make sure the source repo is clean and pushed (`git status` already clean, develop is up-to-date).

## Step-by-step

### Step 1 — Backup the source

```bash
cd ~/IdeaProjects
git clone --mirror equipment equipment-backup.git
```

A mirror clone is the canonical "I might break something, give me a recoverable copy" backup — it includes every ref and
is bit-for-bit restorable.

### Step 2 — Create equipment-backend

```bash
mkdir -p ~/IdeaProjects/split-work && cd ~/IdeaProjects/split-work
git clone ~/IdeaProjects/equipment equipment-backend
cd equipment-backend
git remote remove origin

# Keep only backend/ and the workflow that builds it; strip the backend/ prefix
git filter-repo \
  --path backend/ \
  --path .github/workflows/publish-backend.yml \
  --path-rename backend/:

# Move publish-backend.yml to its standard location
git filter-repo --path-rename .github/workflows/publish-backend.yml:.github/workflows/publish.yml --force

git remote add origin git@github.com:paulwoods/equipment-backend.git
git push -u origin develop
git push origin --tags
```

`--path-rename backend/:` strips the leading `backend/` so files land at the new repo's root. The second `filter-repo`
invocation (with `--force` because it's no longer a fresh clone) renames the workflow.

### Step 3 — Create equipment-frontend

Same shape as backend:

```bash
cd ~/IdeaProjects/split-work
git clone ~/IdeaProjects/equipment equipment-frontend
cd equipment-frontend
git remote remove origin

git filter-repo \
  --path frontend/ \
  --path .github/workflows/publish-frontend.yml \
  --path-rename frontend/:

git filter-repo --path-rename .github/workflows/publish-frontend.yml:.github/workflows/publish.yml --force

git remote add origin git@github.com:paulwoods/equipment-frontend.git
git push -u origin develop
git push origin --tags
```

### Step 4 — Create equipment-e2e

```bash
cd ~/IdeaProjects/split-work
git clone ~/IdeaProjects/equipment equipment-e2e
cd equipment-e2e
git remote remove origin

git filter-repo --path e2e/ --path-rename e2e/:

git remote add origin git@github.com:paulwoods/equipment-e2e.git
git push -u origin develop
git push origin --tags
```

### Step 5 — Slim the existing equipment repo (orchestration shell)

```bash
cd ~/IdeaProjects/split-work
git clone ~/IdeaProjects/equipment equipment-shell
cd equipment-shell

# Drop the three subtrees (and their CI). Keep everything else.
git filter-repo \
  --invert-paths \
  --path backend/ \
  --path frontend/ \
  --path e2e/ \
  --path .github/workflows/publish-backend.yml \
  --path .github/workflows/publish-frontend.yml

# Push back to the existing remote
git remote add origin git@github.com:paulwoods/equipment.git
git push --force --tags origin develop
```

`--invert-paths` means "keep everything *except* these paths". The result still contains `docker-compose.yml`,
`deployment/`, `docs/`, `data/`, `equipment.json`, the `.gitignore`, etc., with full history for those paths.

Force-push is required because the SHAs of every commit changed (rewrite). Coordinate with anyone else who has clones —
they need to re-clone.

### Step 6 — Update the shell repo's contents

After the rewrite, in `equipment-shell` (or a fresh clone), commit the followups:

- Update `docker-compose.yml` and any `deployment/docker-compose.yml` so backend/frontend images are pulled from
  registries (no longer built from sibling dirs).
- Update `deployment/deploy.sh` references if it assumes sibling source.
- Update README / docs to point developers at the four-repo layout.
- Optionally add a top-level `README.md` linking to the three child repos.

These are normal commits — no history rewriting.

### Step 7 — Verify

In each new repo:

```bash
git log --oneline | wc -l           # commit count is reasonable
git log --follow -- <some-file>     # history follows back through original
git log --all --pretty=format:'%H %s' | head
```

Spot-check that a known older change (e.g. the `2.0.27` version bump for backend) appears in `equipment-backend` history
but not in `equipment-frontend`.

For the shell repo, verify `docker-compose up` still brings up postgres and any retained services.

## Critical files referenced

- `.github/workflows/publish-backend.yml` — moves to backend repo, renamed to `publish.yml`
- `.github/workflows/publish-frontend.yml` — moves to frontend repo, renamed to `publish.yml`
- `docker-compose.yml` — stays in shell, will need an edit in step 6
- `deployment/deploy.sh` — stays in shell, may need edits in step 6
- `.gitignore` — stays in shell; the child repos may want their own scoped gitignores added later

## Rollback

If anything goes wrong before step 5's force-push, nothing is destroyed — the source repo and the GitHub `equipment`
remote are untouched.

If step 5's force-push needs reverting, restore from the mirror clone made in step 1:

```bash
cd ~/IdeaProjects/equipment-backup.git
git push --mirror git@github.com:paulwoods/equipment.git
```
