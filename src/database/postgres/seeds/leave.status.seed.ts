import { connectionSource } from "../../../config/typeorm.config";
import { LeaveStatusEntity } from "../entities/leave-status.entity";

export const LeaveStatusSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const leaveStatusRepo = connectionSource.getRepository(LeaveStatusEntity);
        const leaveStatuss = [
            { id: "PENDING", name: "Pending", description: "Pending" },
            { id: "APPROVED", name: "Approved", description: "Approved" },
            { id: "REJECTED", name: "Rejected", description: "Rejected" },
        ];

        // Optional: Insert only if leaveStatus does not already exist
        for (const leaveStatus of leaveStatuss) {
            const exists = await leaveStatusRepo.findOneBy({ id: leaveStatus.id });
            if (!exists) {
                await leaveStatusRepo.save(leaveStatus);
            }
        }

    } catch (error) {
        console.error("Error seeding LeaveStatusEntity:", error);
    } finally {
        // await connectionSource.destroy();
    }
};

// LeaveStatusSeeds();
