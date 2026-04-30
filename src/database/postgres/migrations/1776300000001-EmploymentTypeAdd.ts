import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 5: add nullable employment_type column to users.
 *
 * Live-DB safe:
 *  - column is added nullable, no default
 *  - DDL is wrapped in IF NOT EXISTS so the migration is idempotent
 *  - no backfill in this step (the next migration handles that in chunks)
 */
export class EmploymentTypeAdd1776300000001 implements MigrationInterface {
    name = 'EmploymentTypeAdd1776300000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employment_type" varchar(16) NULL`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_employment_type" ON "users" ("employment_type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_employment_type"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "employment_type"`);
    }
}
