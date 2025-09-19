import { connectionSource } from "../../../config/typeorm.config";
import { TimesheetStatusEntity } from "../entities/timesheet-status.entity";

export const TimesheetStatusSeeds = async () => {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        const timesheetStatusRepo = connectionSource.getRepository(TimesheetStatusEntity);
        const timesheetStatuses = [
            { id: "PENDING", name: "Pending", description: "Pending" },
            { id: "APPROVED", name: "Approved", description: "Approved" },
            { id: "SUBMITTED", name: "Submitted", description: "Submitted" },
            { id: "REJECTED", name: "Rejected", description: "Rejected" },
        ];

        // Optional: Check if records exist to avoid duplicates
        for (const status of timesheetStatuses) {
            const exists = await timesheetStatusRepo.findOneBy({ id: status.id });
            if (!exists) {
                await timesheetStatusRepo.save(status);
            }
        }

    } catch (error) {
        console.error("Error seeding TimesheetStatus:", error);
    } finally {
        // await connectionSource.destroy();
    }
};

// TimesheetStatusSeeds();
