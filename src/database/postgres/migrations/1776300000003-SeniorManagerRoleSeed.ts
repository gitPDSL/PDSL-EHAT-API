import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 5: seed the SENIOR_MANAGER role.
 *
 * Live-DB safe:
 *  - INSERT ... ON CONFLICT DO NOTHING is fully idempotent
 *  - down() removes the row only if no users are assigned to it; otherwise
 *    leaves it alone to avoid breaking foreign keys.
 */
export class SeniorManagerRoleSeed1776300000003 implements MigrationInterface {
    name = 'SeniorManagerRoleSeed1776300000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "roles" ("id", "name", "description", "created_at", "updated_at")
             VALUES ('SENIOR_MANAGER', 'Senior Manager', 'Approves all hours and leave for direct and indirect reportees', now(), now())
             ON CONFLICT ("id") DO NOTHING`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const inUse: any = await queryRunner.query(
            `SELECT COUNT(*)::int AS count FROM "users" WHERE "role_id" = 'SENIOR_MANAGER'`,
        );
        const count = inUse?.[0]?.count ?? 0;
        if (count > 0) {
            console.warn(`SeniorManagerRoleSeed.down: ${count} users still have SENIOR_MANAGER role; leaving the row in place.`);
            return;
        }
        await queryRunner.query(`DELETE FROM "roles" WHERE "id" = 'SENIOR_MANAGER'`);
    }
}
