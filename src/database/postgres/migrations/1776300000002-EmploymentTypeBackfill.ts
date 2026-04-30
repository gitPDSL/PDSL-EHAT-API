import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 5: backfill users.employment_type using EMPLOYEE_DOMAINS.
 *
 * Live-DB safe:
 *  - chunked: only updates 1000 rows at a time, so big tables don't take a
 *    single long lock
 *  - idempotent: only touches rows where employment_type IS NULL
 *  - irreversible by design: down() leaves the data in place (we do NOT
 *    null out a column that the application now relies on)
 *
 * EMPLOYEE_DOMAINS is read from the environment at migration time. Defaults
 * to 'pdsl.com'. Comma-separated, case-insensitive, exact suffix match
 * (no wildcards).
 */
export class EmploymentTypeBackfill1776300000002 implements MigrationInterface {
    name = 'EmploymentTypeBackfill1776300000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const raw = (process.env.EMPLOYEE_DOMAINS ?? 'pdsl.com')
            .split(',')
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean);
        if (raw.length === 0) {
            raw.push('pdsl.com');
        }

        // Build a SQL OR list of exact-suffix matches, parameterised to avoid
        // SQL injection via env vars.
        const params: string[] = raw.map((d) => `%@${d}`);
        const whereClause = raw.map((_, i) => `lower("email") LIKE $${i + 1}`).join(' OR ');

        // Chunked update: EMPLOYEE first, then CONTRACTOR for the remainder.
        const BATCH = 1000;
        let updated = 0;
        // EMPLOYEEs by domain match
        // Postgres has no LIMIT on UPDATE; use a CTE with id IN (subquery LIMIT N).
        // Loop until no more rows match.
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result: any = await queryRunner.query(
                `WITH cte AS (
                    SELECT id FROM "users"
                    WHERE "employment_type" IS NULL AND (${whereClause})
                    LIMIT ${BATCH}
                )
                UPDATE "users" u
                SET "employment_type" = 'EMPLOYEE'
                FROM cte
                WHERE u.id = cte.id
                RETURNING u.id`,
                params,
            );
            const rows = Array.isArray(result) ? result.length : (result?.affected ?? 0);
            updated += rows;
            if (rows === 0) break;
        }

        // CONTRACTORs = everyone left
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result: any = await queryRunner.query(
                `WITH cte AS (
                    SELECT id FROM "users"
                    WHERE "employment_type" IS NULL
                    LIMIT ${BATCH}
                )
                UPDATE "users" u
                SET "employment_type" = 'CONTRACTOR'
                FROM cte
                WHERE u.id = cte.id
                RETURNING u.id`,
            );
            const rows = Array.isArray(result) ? result.length : (result?.affected ?? 0);
            updated += rows;
            if (rows === 0) break;
        }

        // Assert: no nulls remain. If this fires, the migration has a bug
        // and TypeORM will roll back the transaction.
        const stragglers: any = await queryRunner.query(
            `SELECT COUNT(*)::int AS count FROM "users" WHERE "employment_type" IS NULL`,
        );
        const remaining = stragglers?.[0]?.count ?? 0;
        if (remaining > 0) {
            throw new Error(
                `EmploymentTypeBackfill: ${remaining} users still have NULL employment_type after backfill. Aborting.`,
            );
        }
        console.log(`EmploymentTypeBackfill: ${updated} users updated, 0 nulls remaining.`);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Irreversible by design: this migration writes data that the
        // application now reads. Nulling employment_type back out would
        // break authz on every call. To revert, also revert
        // EmploymentTypeAdd, which drops the column entirely.
    }
}
