import { MigrationInterface, QueryRunner } from "typeorm";

export class SoftDeleteUsers1776180457609 implements MigrationInterface {
    name = 'SoftDeleteUsers1776180457609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timesheets" DROP CONSTRAINT "FK_e87f4a4a85cb9932938c695a692"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "timesheets" ADD CONSTRAINT "FK_e87f4a4a85cb9932938c695a692" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "timesheets" DROP CONSTRAINT "FK_e87f4a4a85cb9932938c695a692"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "timesheets" ADD CONSTRAINT "FK_e87f4a4a85cb9932938c695a692" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
