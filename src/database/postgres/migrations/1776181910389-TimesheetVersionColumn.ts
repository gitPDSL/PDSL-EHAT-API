import { MigrationInterface, QueryRunner } from "typeorm";

export class TimesheetVersionColumn1776181910389 implements MigrationInterface {
    name = 'TimesheetVersionColumn1776181910389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timesheets" ADD "version" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timesheets" DROP COLUMN "version"`);
    }

}
