# e2e test harness

One smoke test per resource — enough to prove the harness boots and routes are reachable. Later phases add real coverage next to their code changes.

## Prerequisites

- Docker (for the throwaway Postgres)
- `.env.test` at the backend root (copy from `.env.test.sample`)

## Running

```bash
# 1. Spin up the test Postgres (runs on port 5433, tmpfs so data is ephemeral)
docker compose -f docker-compose.test.yml up -d

# 2. Run the suite
npm run test:e2e

# 3. When done
docker compose -f docker-compose.test.yml down
```

`jest-e2e.json` uses `maxWorkers: 1` so specs run serially against the shared DB.

## How it works

- `helpers/env-setup.ts` is a jest `setupFiles` entry. It loads `.env.test` and forces `NODE_ENV=test` + `TYPEORM_ALLOW_SCHEMA_SYNC=true` before any test file is imported, so the `JwtModule`/`PostgresModule` constants resolve correctly.
- `helpers/app-factory.ts` boots an `AppModule` instance with the same global prefix, pipes, and filters as `main.ts`, and overrides `MailerService` with an in-memory fake so no SMTP connection is attempted.
- `helpers/seed.ts` inserts the minimum roles, timesheet statuses, and one ACTIVE admin user per spec (unique email per spec to avoid collisions).
- Each spec gets its own app instance and tears it down in `afterAll`.

## Adding a new spec

1. Create `test/<resource>.e2e-spec.ts`.
2. Call `createTestApp()` and `seedBase(dataSource, '<resource>-test')` in `beforeAll`.
3. Close `app` in `afterAll`.
4. Use a unique `emailPrefix` so your seeded user doesn't collide with other specs.
