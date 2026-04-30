import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 6: project caps + per-user targets + correction requests.
 *
 * Live-DB safe (see MIGRATIONS.md):
 *  - All ALTERs add nullable columns with sensible defaults so existing rows
 *    are touched only by the column-default rewrite Postgres performs once.
 *  - The new correction_requests table uses IF NOT EXISTS.
 *  - down() drops new structures only; never edits historical data.
 */
export class ProjectCapsAndTargets1776300000010 implements MigrationInterface {
    name = 'ProjectCapsAndTargets1776300000010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Projects: alert threshold + last-alerted timestamp.
        await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "alert_threshold_hours" int NOT NULL DEFAULT 50`);
        await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "alerted_at" timestamp NULL`);

        // Users: daily + weekly target hours. No max field by design.
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_target_hours" numeric(4,2) NOT NULL DEFAULT 8`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_target_hours" numeric(5,2) NOT NULL DEFAULT 40`);

        // Correction requests table.
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "correction_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "timesheet_id" uuid NOT NULL,
                "requested_by" uuid NOT NULL,
                "reason" text NOT NULL,
                "status" varchar(16) NOT NULL DEFAULT 'PENDING',
                "reviewed_by" uuid NULL,
                "reviewed_at" timestamp NULL,
                "decision_note" text NULL,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "pk_correction_requests" PRIMARY KEY ("id"),
                CONSTRAINT "fk_correction_requests_timesheet" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_correction_requests_requested_by" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_correction_requests_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_correction_requests_timesheet" ON "correction_requests" ("timesheet_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_correction_requests_status" ON "correction_requests" ("status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_correction_requests_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_correction_requests_timesheet"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "correction_requests"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "weekly_target_hours"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "daily_target_hours"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "alerted_at"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "alert_threshold_hours"`);
    }
}
