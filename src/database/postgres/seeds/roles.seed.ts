import { connectionSource } from "../../../config/typeorm.config";
import { RoleEntity } from "../entities/role.entity";

export const RoleSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const roleRepo = connectionSource.getRepository(RoleEntity);
        const roles = [
            { id: "MANAGER", name: "Manager", description: "Manager" },
            { id: "USER", name: "Employee", description: "Employee" },
            { id: "ADMIN", name: "Admin User", description: "Admin User" },
        ];

        // Optional: Insert only if role does not already exist
        for (const role of roles) {
            const exists = await roleRepo.findOneBy({ id: role.id });
            if (!exists) {
                await roleRepo.save(role);
            }
        }

    } catch (error) {
        console.error("Error seeding RoleEntity:", error);
    } finally {
        // await connectionSource.destroy();
    }
};

// RoleSeeds();
