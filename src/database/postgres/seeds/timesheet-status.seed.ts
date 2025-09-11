import { connectionSource } from "src/config/typeorm.config";
import { TimesheetStatusEntity } from "../entities/timesheet-status.entity";

async function seed() {
    await connectionSource.initialize();
    const timesheetStatusRepo = connectionSource.getRepository(TimesheetStatusEntity);
    const timesheetStatuses = [
        {
            id: "PENDING",
            name: "Pending",
            description: "Pending"
        },
        {
            id: "APPROVED",
            name: "Approved",
            description: "Approved"
        },
    ];
    await timesheetStatusRepo.save(timesheetStatuses);
}
seed();