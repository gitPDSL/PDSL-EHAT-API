import { MigrationInterface, QueryRunner } from "typeorm";

/**
 *  - users.employee_id varchar(8) NULL UNIQUE: 4-5 digit company id.
 *  - users.username varchar(64) NULL UNIQUE: derived from full name + employee
 *    id (e.g. "ankit.virdi.10234"). Login accepts email or username.
 *  - Backfill usernames for existing rows where possible:
 *      slug(full_name) || '.' || coalesce(employee_id, last 4 of id)
 *    Existing rows without a fullName fall back to the email local-part.
 *  - Tighten ANNUAL accrual cap to 20 days/year (was 25). Clamp existing
 *    accrued_this_year balances above 20 down to 20 so nobody is sitting
 *    above the new cap after deploy.
 *
 * All ALTERs use IF NOT EXISTS, the unique indexes use IF NOT EXISTS,
 * the cap update is idempotent. Live-DB safe.
 */
export class EmployeeIdAndUsername1776300000060 implements MigrationInterface {
    name = 'EmployeeIdAndUsername1776300000060';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_id" varchar(8) NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" varchar(64) NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_users_employee_id" ON "users" ("employee_id") WHERE "employee_id" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uniq_users_username" ON "users" ("username") WHERE "username" IS NOT NULL`);

        // Backfill usernames for existing rows.
        //   - lowercase, replace any run of non [a-z0-9] with '.'
        //   - trim leading/trailing dots
        //   - append '.' + employee_id when present, else last 4 of UUID
        // Rows with no fullName fall back to the email local-part. Rows with
        // neither fall back to 'user.<last4>' so the column can be filled.
        await queryRunner.query(`
            UPDATE "users"
            SET "username" = LOWER(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        COALESCE(
                            NULLIF(REGEXP_REPLACE(LOWER("full_name"), '[^a-z0-9]+', '.', 'g'), ''),
                            NULLIF(SPLIT_PART(LOWER(COALESCE("email", '')), '@', 1), ''),
                            'user'
                        ),
                        '^\\.+|\\.+$', '', 'g'
                    ),
                    '\\.+', '.', 'g'
                )
            ) || '.' || COALESCE("employee_id", SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 4))
            WHERE "username" IS NULL
        `);

        // Drop the ANNUAL cap to 20/year (was 25). 20/12 = 1.667/mo accrual.
        await queryRunner.query(`
            UPDATE "leave_accrual_rules"
            SET "cap_days" = 20, "accrual_per_month" = 1.667
            WHERE "leave_type_id" = 'ANNUAL'
        `);
        // Clamp any existing balances already above 20.
        await queryRunner.query(`
            UPDATE "leave_balances"
            SET "accrued_this_year" = 20
            WHERE "leave_type_id" = 'ANNUAL' AND "accrued_this_year" > 20
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "uniq_users_username"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "uniq_users_employee_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "employee_id"`);
        await queryRunner.query(`UPDATE "leave_accrual_rules" SET "cap_days" = 25 WHERE "leave_type_id" = 'ANNUAL'`);
    }
}
