# Migration rules for the live eHAT database

The production eHAT database has roughly 2 years of data and several
hundred users. Every migration we ship has to be runnable against that
DB without taking long locks, dropping data, or failing partway through
in a way that leaves the schema inconsistent. These are the rules we
follow on every PR that touches `src/database/postgres/migrations`.

## Hard rules

1. **Idempotent only.** Every DDL statement uses `IF NOT EXISTS` /
   `IF EXISTS`. Every DML uses `ON CONFLICT DO NOTHING` or an explicit
   `WHERE` that filters out already-applied rows. Re-running a
   migration must never error.

2. **Additive first.** New columns are added nullable, with no default
   if the table is large. Defaults can be applied in a follow-up
   migration after backfill is verified, since adding a default to an
   existing big table rewrites every row.

3. **Backfill in chunks.** A single `UPDATE users SET ...` against
   hundreds of thousands of rows takes a long lock. Use a CTE +
   `LIMIT 1000` loop instead, exiting when no rows match. See
   `1776300000002-EmploymentTypeBackfill.ts` for the canonical pattern.

4. **No destructive `down()`.** A migration that writes data the
   application now reads cannot be cleanly reversed. `down()` is a
   comment explaining why, not an attempt to null the column out.
   To revert a backfill, also revert the column-add migration that
   preceded it.

5. **No renaming columns or tables in place.** A rename is a destructive
   schema change in disguise. If a column needs a new name, add the new
   column, dual-write for a release, switch readers over, drop the old
   column in a later migration. We have not had to do this yet; if you
   need to, write a design doc first.

6. **Never set NOT NULL** on a column that has historical NULL rows
   without first running a backfill migration and asserting zero NULLs
   remain. If that's hard to guarantee, leave the column nullable
   forever and handle NULLs in the application.

7. **Indexes on big tables go in their own migration.** TypeORM doesn't
   expose `CREATE INDEX CONCURRENTLY`, so for any index on a multi-million
   row table use raw SQL with the `CONCURRENTLY` keyword. Single
   migration, only that index. (Today no table is that big, but this is
   the rule when one is.)

8. **No foreign-key cascades pointing at user data.** Already an issue
   in the original schema (`timesheet.user_id ON DELETE CASCADE` was
   relaxed in Phase 1 D). Don't introduce new ones.

## Process

- Generate via `npm run typeorm:generate` only as a starting point. The
  generator produces `synchronize`-style migrations that often violate
  the rules above (renames, dropped columns). Read every generated
  migration before committing.
- Hand-write the migration when the generator's output is not safe.
- Run `npm run typeorm:migrate` against a Postgres clone, then run it
  again to verify idempotency.
- For migrations that backfill, log the row count at the end and,
  ideally, assert a post-condition (e.g. zero NULLs remaining).
- Never write data in `down()`. Reverting a migration should never
  destroy production data.

## Phase 5 examples

- `EmploymentTypeAdd`: pure DDL, `IF NOT EXISTS`, instant.
- `EmploymentTypeBackfill`: chunked 1000-row updates, asserts zero
  NULLs remain at the end, irreversible by design.
- `SeniorManagerRoleSeed`: idempotent INSERT, `down()` no-ops if
  any user is still assigned to the role.
