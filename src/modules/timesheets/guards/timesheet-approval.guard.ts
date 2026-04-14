import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { TimesheetService } from '../services/timesheet.service';

@Injectable()
export class TimesheetApprovalGuard implements CanActivate {
    constructor(private readonly timesheetService: TimesheetService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new ForbiddenException('Not authenticated');
        }
        if (user.role?.id === 'ADMIN') {
            return true;
        }

        const id: string | undefined = req.params?.id;
        if (!id) {
            throw new ForbiddenException('Missing timesheet id');
        }

        const timesheet: any = await this.timesheetService.findById(id, [
            'user',
            'user.manager',
            'project',
            'project.manager',
        ]);
        if (!timesheet) {
            throw new NotFoundException('Timesheet not found');
        }

        const changesStatus =
            req.body && Object.prototype.hasOwnProperty.call(req.body, 'status');

        if (changesStatus) {
            const projectManagerId = timesheet.project?.manager?.id;
            const lineManagerId = timesheet.user?.manager?.id;
            if (user.id === projectManagerId || user.id === lineManagerId) {
                return true;
            }
            throw new ForbiddenException(
                'Only the project manager or the employee line manager can change timesheet status',
            );
        }

        const ownerId = timesheet.userId;
        if (user.id === ownerId) {
            return true;
        }
        throw new ForbiddenException(
            'Only the timesheet owner can edit their entries',
        );
    }
}
