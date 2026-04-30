import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 10: payslip repository.
 *
 * Stores PDF payslips inline as bytea. Trade-off: keeps the demo running on
 * Render's free tier without the persistent-disk add-on, and keeps the data
 * inside the DB backup. For real production volumes (>1k employees x 12
 * months x 200KB) consider a follow-up migration that moves bytes to Render
 * disk or S3 and keeps this table as metadata only.
 *
 * Live-DB safe:
 *  - CREATE TABLE IF NOT EXISTS, indexes IF NOT EXISTS.
 *  - Unique on (user_id, payroll_period_id) so re-uploading replaces the
 *    old payslip via service-level upsert; no race on insert.
 */
export class Payslips1776300000040 implements MigrationInterface {
    name = 'Payslips1776300000040';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payslip_documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "payroll_period_id" uuid NOT NULL,
                "filename" text NOT NULL,
                "content_type" varchar(100) NOT NULL DEFAULT 'application/pdf',
                "size_bytes" int NOT NULL DEFAULT 0,
                "content" bytea NOT NULL,
                "uploaded_by" uuid NULL,
                "uploaded_at" timestamp NOT NULL DEFAULT now(),
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "pk_payslip_documents" PRIMARY KEY ("id"),
                CONSTRAINT "uq_payslip_documents_user_period" UNIQUE ("user_id", "payroll_period_id"),
                CONSTRAINT "fk_payslip_documents_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_payslip_documents_period" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_payslip_documents_uploaded_by" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payslip_documents_user" ON "payslip_documents" ("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payslip_documents_period" ON "payslip_documents" ("payroll_period_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_payslip_documents_period"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_payslip_documents_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payslip_documents"`);
    }
}
