import { connectionSource } from "../../../config/typeorm.config";
import { TimesheetStatusSeeds } from "./timesheet-status.seed";
import { ProjectStatusSeeds } from "./project-status.seed";
import { RoleSeeds } from "./roles.seed";
import { LeaveTypeSeeds } from "./leave.type.seed";
import { LeaveStatusSeeds } from "./leave.status.seed";

async function runLookupSeeds() {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }
        await TimesheetStatusSeeds();
        await RoleSeeds();
        await ProjectStatusSeeds();
        await LeaveTypeSeeds();
        await LeaveStatusSeeds();
        console.log("Lookup seeds applied: timesheet statuses, roles, project statuses, leave types, leave statuses.");
    } catch (error) {
        console.error("Error running lookup seeds:", error);
    } finally {
        if (connectionSource.isInitialized) {
            await connectionSource.destroy();
        }
    }
}

runLookupSeeds();
