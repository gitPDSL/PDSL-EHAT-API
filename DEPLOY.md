# Deploying the eHAT API on Render

This repo ships a `render.yaml` blueprint that provisions:

- `ehat-api` — a Node web service running the Nest backend (free plan)
- `ehat-db` — a managed PostgreSQL instance (free plan, 90 day expiry)

## One-time setup

1. Push `ankit-dev` (or `master`) to the GitHub remote you want Render to track.
2. In Render, **New → Blueprint** and point at this repo. Render reads
   `render.yaml` and creates both services.
3. Fill in the `sync: false` secrets when prompted:
   - `APP_URL` — the public URL of the **frontend** (e.g. `https://ehat-web.onrender.com`).
     Used for CORS and to embed verification / reset links in emails.
   - `NO_REPLY` — From-address shown on outgoing mail (e.g. `noreply@yourdomain.com`).
   - `SUPPORT_EMAIL` — Reply-to address shown in templates.
   - `SMTP_CLIENT_ID`, `SMTP_CLIENT_SECRET`, `SMTP_REFRESH_TOKEN`, `SMTP_EMAIL_USER`
     — Gmail OAuth2 credentials. See the project README for the OAuth Playground walk-through.
   - `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` — login created automatically
     on first boot if no admin exists. Rotate after first sign-in.

The remaining env vars are auto-generated or wired from the database.

## What runs at deploy

- `buildCommand`: `npm install --legacy-peer-deps && npm run build`
- `startCommand`: `npm run typeorm:migrate && npm run typeorm:seed:lookups && npm run start:prod`
  - Migrations and lookup seeds are folded into the start command because
    Render's free tier does not allow a separate pre-deploy step.
  - Runs all pending TypeORM migrations against the managed DB on every
    boot. Migrations are idempotent so this is safe.
  - Seeds lookup tables only (roles, statuses, leave types). Does **not**
    seed `support@pdsltech.com`; the bootstrap admin handles the first user.
  - On a paid plan, move the migrate + seed steps into `preDeployCommand`
    so they run once per deploy instead of on every dyno start.
- On boot the `BootstrapAdminService` runs once: if `BOOTSTRAP_ADMIN_EMAIL` is
  set and there is no `ADMIN`/`SUPER_ADMIN` row, it creates one.

## Health check

`/api/health` is the configured health endpoint. Render will wait for a 200
before routing traffic.

## Notes on Render's free tier

- The web service sleeps after 15 minutes idle and takes ~30 seconds to wake.
  For a live demo, hit it once shortly before showing it.
- Free Postgres expires 90 days after creation. Re-provision and re-run the
  blueprint when that happens.
- Internal cron jobs run inside the Nest process — they're paused while the
  service is asleep.

## Rolling forward

- Push to the tracked branch and Render redeploys automatically. Migrations
  run as part of the pre-deploy step.
- To rotate the admin password, sign in, change it from the People page, then
  blank out `BOOTSTRAP_ADMIN_PASSWORD` in Render so it can't recreate the
  bootstrap user.
