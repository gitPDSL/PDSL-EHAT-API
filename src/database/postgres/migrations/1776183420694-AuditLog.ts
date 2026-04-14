import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditLog1776183420694 implements MigrationInterface {
    name = 'AuditLog1776183420694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid, "action" text NOT NULL, "entity_type" text NOT NULL, "entity_id" text NOT NULL, "before" jsonb, "after" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_audit_created_at" ON "audit_logs" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_entity"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_created_at"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
