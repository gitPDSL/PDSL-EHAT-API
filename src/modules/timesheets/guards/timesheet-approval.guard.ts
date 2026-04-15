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

    private isActiveDelegateFor(callerId: string, manager: any): boolean {
        if (!manager) return false;
        if (manager.delegateManagerId !== callerId) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (manager.delegateFrom && today < String(manager.delegateFrom).slice(0, 10)) return false;
        if (manager.delegateTo && today > String(manager.delegateTo).slice(0, 10)) return false;
        return true;
    }

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
            const projectManager = timesheet.project?.manager;
            const lineManager = timesheet.user?.manager;
            if (user.id === projectManager?.id || user.id === lineManager?.id) {
                return true;
            }
            if (this.isActiveDelegateFor(user.id, projectManager) || this.isActiveDelegateFor(user.id, lineManager)) {
                return true;
            }
            throw new ForbiddenException(
                'Only the project manager or the employee line manager (or an active delegate) can change timesheet status',
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
