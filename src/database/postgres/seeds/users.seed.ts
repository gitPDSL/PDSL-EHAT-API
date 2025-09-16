import { connectionSource } from "../../../config/typeorm.config";
import { ACCOUNT_STATUS, UserEntity } from "../entities/user.entity";
import * as bcrypt from 'bcrypt';

export const UserSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const UserRepo = connectionSource.getRepository(UserEntity);
        const password = await bcrypt.hash("Super@123", 10);
        const Users = [
            {
                "fullName": "Super Admin",
                "email": "support@pdsltech.com",
                "passwordHash": password,
                "designation": "Admin",
                "department": null,
                "role": { id: "ADMIN", name: "Admin User", description: "Admin User" },
                "status": ACCOUNT_STATUS.ACTIVE,
                "manager": null
            }

        ];

        // Optional: Insert only if User does not already exist
        for (const User of Users) {
            const exists = await UserRepo.findOneBy({ email: User.email });
            if (!exists) {
                await UserRepo.save(User);
            }
        }

    } catch (error) {
        console.error("Error seeding UserEntity:", error);
    } finally {
        // await connectionSource.destroy();
    }
};

// UserSeeds();
