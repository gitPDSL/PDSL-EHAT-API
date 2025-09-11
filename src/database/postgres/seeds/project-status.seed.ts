import { connectionSource } from "../../../config/typeorm.config";
import { ProjectStatusEntity } from "../entities/project-status.entity";

export const ProjectStatusSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const projectStatusRepo = connectionSource.getRepository(ProjectStatusEntity);
        const projectStatuses = [
            { id: "ACTIVE", name: "Active", description: "Active" },
            { id: "COMPLETED", name: "Completed", description: "Completed" },
            { id: "ONHOLD", name: "On Hold", description: "On Hold" },
        ];

        // Optional: Insert only if not already present
        for (const status of projectStatuses) {
            const exists = await projectStatusRepo.findOneBy({ id: status.id });
            if (!exists) {
                await projectStatusRepo.save(status);
            }
        }

    } catch (error) {
        console.error("Error seeding ProjectStatusEntity:", error);
    } finally {
        await connectionSource.destroy();
    }
};

// ProjectStatusSeeds();
