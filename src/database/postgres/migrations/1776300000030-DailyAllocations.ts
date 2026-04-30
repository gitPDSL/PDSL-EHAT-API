import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 8: planning grid persistence.
 *
 * daily_allocations is the resource-allocation source of truth: the planned
 * hours a user × project will spend on a given day. Submitted timesheet
 * hours are still the "actual" record; allocations are the forecast that
 * the planning grid edits.
 *
 * Live-DB safe:
 *  - CREATE TABLE IF NOT EXISTS so reruns are no-ops.
 *  - Unique constraint covers the natural key (user, project, date) so
 *    upserts work without races.
 *  - All FKs point at existing columns; ON DELETE CASCADE on user/project
 *    so deleting either cleans up future allocations.
 */
export class DailyAllocations1776300000030 implements MigrationInterface {
    name = 'DailyAllocations1776300000030';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "daily_allocations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "project_id" uuid NOT NULL,
                "date" date NOT NULL,
                "planned_hours" numeric(5,2) NOT NULL DEFAULT 0,
                "planned_by" uuid NULL,
                "planned_at" timestamp NOT NULL DEFAULT now(),
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "pk_daily_allocations" PRIMARY KEY ("id"),
                CONSTRAINT "uq_daily_allocations_user_project_date" UNIQUE ("user_id", "project_id", "date"),
                CONSTRAINT "fk_daily_allocations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_daily_allocations_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_daily_allocations_planned_by" FOREIGN KEY ("planned_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_daily_allocations_date" ON "daily_allocations" ("date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_daily_allocations_user_date" ON "daily_allocations" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_daily_allocations_project_date" ON "daily_allocations" ("project_id", "date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_daily_allocations_project_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_daily_allocations_user_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_daily_allocations_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "daily_allocations"`);
    }
}
