import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 5: backfill users.employment_type using EMPLOYEE_DOMAINS.
 *
 * Live-DB safe:
 *  - Two single-statement UPDATEs (one per classification). For the actual
 *    scale (hundreds of users) this finishes in milliseconds.
 *  - Idempotent: only touches rows where employment_type IS NULL, so re-runs
 *    are a no-op.
 *  - Asserts zero NULLs remain at the end and rolls back if any are found.
 *  - Irreversible by design: down() leaves the data in place. To revert,
 *    also revert EmploymentTypeAdd which drops the column entirely.
 *
 * EMPLOYEE_DOMAINS is read from the environment at migration time. Defaults
 * to 'pdsl.com'. Comma-separated, case-insensitive, exact suffix match.
 *
 * NOTE: an earlier version of this migration used a CTE + LIMIT loop with
 * a RETURNING clause to read row counts. That implementation could spin
 * forever because TypeORM's queryRunner.query returns an [rows, rowCount]
 * pair on UPDATE under some Postgres driver versions, which made
 * result.length always evaluate to 2 instead of the actual updated count.
 * Replaced with single statements to remove the foot-gun.
 */
export class EmploymentTypeBackfill1776300000002 implements MigrationInterface {
    name = 'EmploymentTypeBackfill1776300000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const raw = (process.env.EMPLOYEE_DOMAINS ?? 'pdsl.com')
            .split(',')
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean);
        if (raw.length === 0) raw.push('pdsl.com');

        const params: string[] = raw.map((d) => `%@${d}`);
        const whereClause = raw.map((_, i) => `lower("email") LIKE $${i + 1}`).join(' OR ');

        await queryRunner.query(
            `UPDATE "users"
             SET "employment_type" = 'EMPLOYEE'
             WHERE "employment_type" IS NULL AND (${whereClause})`,
            params,
        );

        await queryRunner.query(
            `UPDATE "users"
             SET "employment_type" = 'CONTRACTOR'
             WHERE "employment_type" IS NULL`,
        );

        const stragglers: any = await queryRunner.query(
            `SELECT COUNT(*)::int AS count FROM "users" WHERE "employment_type" IS NULL`,
        );
        const remaining = stragglers?.[0]?.count ?? 0;
        if (remaining > 0) {
            throw new Error(
                `EmploymentTypeBackfill: ${remaining} users still have NULL employment_type after backfill. Aborting.`,
            );
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // Irreversible by design.
    }
}
