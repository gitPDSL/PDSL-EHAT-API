import { MigrationInterface, QueryRunner } from "typeorm";

export class BillableAndRates1776289905732 implements MigrationInterface {
    name = 'BillableAndRates1776289905732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cilents" ADD "currency" character varying(3) NOT NULL DEFAULT 'GBP'`);
        await queryRunner.query(`ALTER TABLE "project_users" ADD "hourly_rate" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "timesheets" ADD "billable" boolean`);
        await queryRunner.query(`ALTER TABLE "projects" ADD "billable" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "billable"`);
        await queryRunner.query(`ALTER TABLE "timesheets" DROP COLUMN "billable"`);
        await queryRunner.query(`ALTER TABLE "project_users" DROP COLUMN "hourly_rate"`);
        await queryRunner.query(`ALTER TABLE "cilents" DROP COLUMN "currency"`);
    }

}
