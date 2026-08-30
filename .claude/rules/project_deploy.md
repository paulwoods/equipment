# Deploying to production

New versions are landed on the droplet by hand — CI publishes images but never
deploys (ADR-0025). The procedure:

1. Edit the live `docker-compose.yml` (on the vm, in `~/caddy`) and set the new
   `equipment-backend` / `equipment-frontend` image tags.
2. Run `deployment/restart.sh` — `docker compose down`, `up -d`, then
   `logs -f`.

This replaced the older `deploy.sh` (sed + pull + `up -d`) flow.

**Why:** User asked (2026-08-29) for this to be the canonical deploy procedure
and added `restart.sh` for it.
**How to apply:** When asked to deploy or bump production, walk these two steps
in this order. Verify afterwards with the `/about` page, which shows both the
client and server versions live (`https://equipment.mrpaulwoods.com/about`).
Optionally `docker compose pull` before `down` so an unpublished tag surfaces
before the stack is halted — `down` + failed `up` leaves the app offline.