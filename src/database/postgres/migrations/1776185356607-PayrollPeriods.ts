import { MigrationInterface, QueryRunner } from "typeorm";

export class PayrollPeriods1776185356607 implements MigrationInterface {
    name = 'PayrollPeriods1776185356607'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payroll_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_date" date NOT NULL, "end_date" date NOT NULL, "locked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "locked_by" uuid, "created_by" uuid, CONSTRAINT "PK_2afd9a853dd55d80ef644b74358" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period_range" ON "payroll_periods" ("start_date", "end_date") `);
        await queryRunner.query(`ALTER TABLE "payroll_periods" ADD CONSTRAINT "FK_1dfe8e0d15cbf972c7820e19c3d" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payroll_periods" ADD CONSTRAINT "FK_7e5a4352223a4e749d16c520849" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payroll_periods" DROP CONSTRAINT "FK_7e5a4352223a4e749d16c520849"`);
        await queryRunner.query(`ALTER TABLE "payroll_periods" DROP CONSTRAINT "FK_1dfe8e0d15cbf972c7820e19c3d"`);
        await queryRunner.query(`DROP INDEX "public"."idx_payroll_period_range"`);
        await queryRunner.query(`DROP TABLE "payroll_periods"`);
    }

}
