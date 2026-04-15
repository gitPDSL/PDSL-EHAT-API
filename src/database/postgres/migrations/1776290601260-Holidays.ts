import { MigrationInterface, QueryRunner } from "typeorm";

export class Holidays1776290601260 implements MigrationInterface {
    name = 'Holidays1776290601260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "holidays" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "name" text NOT NULL, "country" character varying(2) NOT NULL DEFAULT 'GB', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, "updated_by" uuid, CONSTRAINT "PK_3646bdd4c3817d954d830881dfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_holidays_country_date" ON "holidays" ("country", "date") `);
        await queryRunner.query(`ALTER TABLE "holidays" ADD CONSTRAINT "FK_11acb5122a39ddb57e5e0076578" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "holidays" ADD CONSTRAINT "FK_b2724a8b1677db353648dfc5c39" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "holidays" DROP CONSTRAINT "FK_b2724a8b1677db353648dfc5c39"`);
        await queryRunner.query(`ALTER TABLE "holidays" DROP CONSTRAINT "FK_11acb5122a39ddb57e5e0076578"`);
        await queryRunner.query(`DROP INDEX "public"."idx_holidays_country_date"`);
        await queryRunner.query(`DROP TABLE "holidays"`);
    }

}
