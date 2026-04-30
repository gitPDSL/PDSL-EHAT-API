import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 7: leave accrual.
 *
 *  - users.hire_date date NULL: drives first-month proration. Existing users
 *    will be NULL, in which case we treat hire_date as Jan 1 of the current
 *    year (full year accrual). Admins can fill it in via the People form.
 *  - users.contract_type varchar(16) NULL: 'FULL_TIME' or 'PART_TIME'.
 *    Part-time scales accrual by weekly_target_hours / 40. Defaults to
 *    FULL_TIME at the application layer when missing.
 *  - leave_balances: accrued_this_year + last_accrual_at + carry_forward.
 *  - leave_types.requires_approval bool default true.
 *  - leave_accrual_rules table: per-leave-type rule.
 *
 * All ALTERs use IF NOT EXISTS, the new table is IF NOT EXISTS, the seed
 * is ON CONFLICT DO NOTHING. Live-DB safe.
 */
export class LeaveAccrual1776300000020 implements MigrationInterface {
    name = 'LeaveAccrual1776300000020';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hire_date" date NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contract_type" varchar(16) NULL`);

        await queryRunner.query(`ALTER TABLE "leave_balances" ADD COLUMN IF NOT EXISTS "accrued_this_year" numeric(6,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "leave_balances" ADD COLUMN IF NOT EXISTS "last_accrual_at" date NULL`);
        await queryRunner.query(`ALTER TABLE "leave_balances" ADD COLUMN IF NOT EXISTS "carry_forward" numeric(6,2) NOT NULL DEFAULT 0`);

        await queryRunner.query(`ALTER TABLE "leave_types" ADD COLUMN IF NOT EXISTS "requires_approval" boolean NOT NULL DEFAULT true`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "leave_accrual_rules" (
                "leave_type_id" varchar NOT NULL,
                "accrual_per_month" numeric(5,3) NOT NULL DEFAULT 0,
                "cap_days" numeric(5,2) NOT NULL DEFAULT 0,
                "carry_forward_cap" numeric(5,2) NOT NULL DEFAULT 0,
                "applies_to_full_time" boolean NOT NULL DEFAULT true,
                "applies_to_part_time" boolean NOT NULL DEFAULT true,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "pk_leave_accrual_rules" PRIMARY KEY ("leave_type_id"),
                CONSTRAINT "fk_leave_accrual_rules_type" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE
            )
        `);

        // Idempotent default rules. Numbers tuned for typical UK contracts:
        //   ANNUAL  → 2.083/mo, cap 25, carry-forward up to 5
        //   SICK    → 0.833/mo, cap 10, no carry forward
        //   CASUAL  → 0.500/mo, cap  6, no carry forward
        await queryRunner.query(`
            INSERT INTO "leave_accrual_rules"
                ("leave_type_id", "accrual_per_month", "cap_days", "carry_forward_cap", "applies_to_full_time", "applies_to_part_time")
            VALUES
                ('ANNUAL', 2.083, 25, 5, true, true),
                ('SICK',   0.833, 10, 0, true, true),
                ('CASUAL', 0.500,  6, 0, true, true)
            ON CONFLICT ("leave_type_id") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "leave_accrual_rules"`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN IF EXISTS "requires_approval"`);
        await queryRunner.query(`ALTER TABLE "leave_balances" DROP COLUMN IF EXISTS "carry_forward"`);
        await queryRunner.query(`ALTER TABLE "leave_balances" DROP COLUMN IF EXISTS "last_accrual_at"`);
        await queryRunner.query(`ALTER TABLE "leave_balances" DROP COLUMN IF EXISTS "accrued_this_year"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "contract_type"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "hire_date"`);
    }
}
