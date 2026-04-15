import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications1776244821561 implements MigrationInterface {
    name = 'Notifications1776244821561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" text NOT NULL, "title" text NOT NULL, "body" text NOT NULL, "metadata" jsonb, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "read_at") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_unread"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
