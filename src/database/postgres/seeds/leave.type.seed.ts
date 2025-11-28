import { connectionSource } from "../../../config/typeorm.config";
import { LeaveTypeEntity } from "../entities/leave-type.entity";

export const LeaveTypeSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const leaveTypeRepo = connectionSource.getRepository(LeaveTypeEntity);
        const leaveTypes = [
            { id: "SICK", name: "Sick Leave", description: "Sick Leave" },
            { id: "ANNUAL", name: "Annual Leave", description: "Annual Leave" },
            { id: "CASUAL", name: "Casual Leave", description: "Casual Leave" },
        ];

        // Optional: Insert only if leaveType does not already exist
        for (const leaveType of leaveTypes) {
            const exists = await leaveTypeRepo.findOneBy({ id: leaveType.id });
            if (!exists) {
                await leaveTypeRepo.save(leaveType);
            }
        }

    } catch (error) {
        console.error("Error seeding LeaveTypeEntity:", error);
    } finally {
        // await connectionSource.destroy();
    }
};

// LeaveTypeSeeds();
