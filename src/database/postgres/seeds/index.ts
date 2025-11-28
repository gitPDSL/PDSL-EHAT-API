import { connectionSource } from "../../../config/typeorm.config";
import { TimesheetStatusSeeds } from "./timesheet-status.seed";
import { ProjectStatusSeeds } from "./project-status.seed";
import { RoleSeeds } from "./roles.seed";
import { UserSeeds } from "./users.seed";
import { LeaveTypeSeeds } from "./leave.type.seed";
import { LeaveStatusSeeds } from "./leave.status.seed";

async function runSeeds() {
    try {
        if (!connectionSource.isInitialized) {
            await connectionSource.initialize();
        }

        await TimesheetStatusSeeds();
        await RoleSeeds();
        await ProjectStatusSeeds();
        await UserSeeds()
        await LeaveTypeSeeds()
        await LeaveStatusSeeds()
    } catch (error) {
        console.error("Error running seeds:", error);
    } finally {
        if (connectionSource.isInitialized) {
            await connectionSource.destroy();
        }
    }
}

runSeeds();
