# Runbook: move the app from `mrpaulwoods.com` to `equipment.mrpaulwoods.com`

**Completed 2026-07-19.** Kept as a record of what was done and why.
Do not re-run it.

One-time migration. The apex is being freed for a future personal site —
there is deliberately **no** apex → subdomain redirect.

Run every command from the deployment directory on the VM.

## Before you start

- **This directory is a sanitized reference copy, not the deployment.**
  Config changes are applied by hand on the VM. Nothing here is pulled
  or pushed to it, so after the migration, mirror the final VM
  `Caddyfile` back into this directory to keep the copy honest.

- **DNS is already done.** `equipment.mrpaulwoods.com` is a CNAME to
  `mrpaulwoods.com` → `146.190.60.48` (same VM). Nothing to create, no
  propagation wait. Registrar is Namecheap.
- **Ports 80 and 443 must stay reachable** from the internet throughout.
  Caddy obtains the new certificate over ACME; blocking either port
  fails issuance.
- **Everyone gets logged out at Stage 2.** Auth cookies are set with no
  `Domain` attribute (`CookieService.buildCookie`), so they are
  host-only and do not carry from the apex to the subdomain. Expected,
  not a bug.

## Stage 0 — ship the `app-url` collapse (independent of the move)

This fixes production password-reset emails, which currently link to
`http://localhost:5173`. See ADR-0033. Deploy and verify it **on the
apex first**, while the old URL still works — if reset emails are still
wrong you find out before the domain changes underneath you.

1. Commit in each submodule (`equipment-backend`, `equipment-e2e`),
   build and push images, bump the submodule pointers in the root repo.
2. `./deploy.sh <backend-version> <frontend-version>`
3. Trigger a password reset for a real account. The email must link to
   `https://mrpaulwoods.com/reset-password?token=…` — **not** localhost.
   Complete the reset; the password must actually change.

Do not proceed to Stage 1 until step 3 passes.

## Stage 1 — subdomain live alongside the apex

Both hostnames serve the app. The apex keeps working the whole time, so
a certificate failure on the new hostname is a non-event you retry at
leisure.

1. Back up the current config. These `.bak` files are the entire
   rollback mechanism — the VM is not version-controlled, so there is
   nothing else to revert to:

   ```bash
   cp .env .env.bak
   cp Caddyfile Caddyfile.bak
   ```

2. In `.env`:

   ```
   APP_URL=https://equipment.mrpaulwoods.com
   CADDY_DOMAIN=equipment.mrpaulwoods.com
   CADDY_APEX_DOMAIN=mrpaulwoods.com
   ```

   `APP_URL` flips **now**, not in Stage 2. During Stage 1 both
   hostnames work, so pointing emails at the new home is zero-risk — and
   it means the new reset-link URL is proven before the old one stops
   working.

3. In `Caddyfile`, temporarily widen the app block to both hostnames:

   ```
   {$CADDY_DOMAIN}, {$CADDY_APEX_DOMAIN} {
   ```

   Leave the apex holding-page block in place but commented out for now
   — the apex is still serving the app, and two blocks claiming the same
   hostname is a config error.

4. `docker compose up -d`

### Stage 1 gate

All six must pass before Stage 2. Number 3 is the hard gate — it is the
only check that exercises the code change rather than the config.

1. `https://equipment.mrpaulwoods.com` loads the SPA with a valid,
   trusted certificate. Check the issuer and expiry, not just that the
   page renders.
2. Login works on the subdomain — confirms `/api/*` proxying and that
   `Secure` / `SameSite=Lax` cookies are set on the new host.
3. **A real password-reset email arrives linking to
   `https://equipment.mrpaulwoods.com/reset-password?token=…`, and the
   link completes a reset.** "The reset page rendered" is not a pass —
   the token must round-trip and the password must actually change.
4. Dashboard email links point at the subdomain. Trigger one via
   `POST /api/v1/email/dashboard` rather than waiting for the schedule.
5. `docker compose logs caddy` shows the certificate was obtained, with
   no repeated ACME retry churn.
6. The apex is still serving the app normally.

Note: during Stage 1 the two hostnames are genuinely separate origins,
so being logged in on the apex and opening the subdomain shows the login
screen. Expected — do not read it as the subdomain being broken.

## Stage 2 — apex becomes the holding page

1. In `Caddyfile`, narrow the app block back to `{$CADDY_DOMAIN} {` and
   uncomment the `{$CADDY_APEX_DOMAIN}` holding-page block.
2. `docker compose up -d`
3. Verify: apex serves "Coming soon" over a valid certificate; the
   subdomain still serves the app; users are logged out and can log
   back in.

When the personal site is ready, replace the `respond` line in the apex
block with `root` / `file_server`. The block already exists and its
certificate is already renewing, so there is no cold-start issuance.

## Rollback

```bash
cp .env.bak .env
cp Caddyfile.bak Caddyfile
docker compose up -d
```

The apex serves the app again. What rollback does **not** undo: any
password-reset email sent after the `APP_URL` flip points at the
subdomain permanently. That is why the Stage 1 gate is a real gate and
not a formality.
