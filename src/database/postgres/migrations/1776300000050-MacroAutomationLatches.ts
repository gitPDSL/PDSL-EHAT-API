import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 11: latches for two macro automation crons.
 *
 *  - projects.idle_alerted_at: timestamp of the last idle-project ping so
 *    we don't email the same project manager every day.
 *  - correction_requests.nudged_at: timestamp of the last stale-correction
 *    nudge so the daily sweep is one-shot per request.
 *
 * Both are nullable, no defaults, IF NOT EXISTS. Live-DB safe.
 */
export class MacroAutomationLatches1776300000050 implements MigrationInterface {
    name = 'MacroAutomationLatches1776300000050';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "idle_alerted_at" timestamp NULL`);
        await queryRunner.query(`ALTER TABLE "correction_requests" ADD COLUMN IF NOT EXISTS "nudged_at" timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "correction_requests" DROP COLUMN IF EXISTS "nudged_at"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "idle_alerted_at"`);
    }
}
