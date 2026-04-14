import { MigrationInterface, QueryRunner } from "typeorm";

export class LeaveTypeDefaults1776184882245 implements MigrationInterface {
    name = 'LeaveTypeDefaults1776184882245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "leave_types" ADD "default_entitlement" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`
            INSERT INTO "leave_types" ("id", "name", "description", "default_entitlement")
            VALUES
                ('ANNUAL', 'Annual Leave', 'Paid annual leave entitlement', 20),
                ('CASUAL', 'Casual Leave', 'Casual short-notice leave', 5)
            ON CONFLICT ("id") DO UPDATE SET
                "name" = EXCLUDED."name",
                "description" = EXCLUDED."description",
                "default_entitlement" = EXCLUDED."default_entitlement"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "leave_types" WHERE "id" IN ('ANNUAL', 'CASUAL')`);
        await queryRunner.query(`ALTER TABLE "leave_types" DROP COLUMN "default_entitlement"`);
    }

}
