import { MigrationInterface, QueryRunner } from "typeorm";

export class DelegateApprover1776292672515 implements MigrationInterface {
    name = 'DelegateApprover1776292672515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "delegate_manager_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "delegate_from" date`);
        await queryRunner.query(`ALTER TABLE "users" ADD "delegate_to" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "delegate_to"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "delegate_from"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "delegate_manager_id"`);
    }

}
