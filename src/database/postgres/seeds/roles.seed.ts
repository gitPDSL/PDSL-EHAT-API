import { connectionSource } from "src/config/typeorm.config";
import { RoleEntity } from "../entities/role.entity";

async function seed() {
    await connectionSource.initialize();
    const roleRepo = connectionSource.getRepository(RoleEntity);
    const roles = [
        {
            id: "MANAGER",
            name: "Manager",
            description: "Manager"
        },
        {
            id: "USER",
            name: "Employee",
            description: "Employee"
        },
        {
            id: "ADMIN",
            name: "Admin User",
            description: "Admin User"
        }

    ];
    await roleRepo.save(roles);
}
seed();