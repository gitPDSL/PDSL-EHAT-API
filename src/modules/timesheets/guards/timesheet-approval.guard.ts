import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { TimesheetService } from '../services/timesheet.service';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const REPORTING_CHAIN_HOPS = 6;

@Injectable()
export class TimesheetApprovalGuard implements CanActivate {
    constructor(
        private readonly timesheetService: TimesheetService,
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    ) { }

    private isActiveDelegateFor(callerId: string, manager: any): boolean {
        if (!manager) return false;
        if (manager.delegateManagerId !== callerId) return false;
        const today = new Date().toISOString().slice(0, 10);
        if (manager.delegateFrom && today < String(manager.delegateFrom).slice(0, 10)) return false;
        if (manager.delegateTo && today > String(manager.delegateTo).slice(0, 10)) return false;
        return true;
    }

    /**
     * Walk up the reporting chain (user.manager → user.manager.manager → ...)
     * up to REPORTING_CHAIN_HOPS hops, stopping if we encounter the candidate
     * id. Cycle-safe via a visited set. Used to test whether a SENIOR_MANAGER
     * is in an employee's reporting chain so they can approve.
     */
    private async isInReportingChain(candidateId: string, employeeId: string): Promise<boolean> {
        const visited = new Set<string>();
        let currentId: string | null = employeeId;
        for (let i = 0; i < REPORTING_CHAIN_HOPS && currentId; i++) {
            if (visited.has(currentId)) return false;
            visited.add(currentId);
            const u: any = await this.userRepository.findOne({
                where: { id: currentId },
                relations: ['manager'],
            });
            const managerId = u?.manager?.id ?? null;
            if (!managerId) return false;
            if (managerId === candidateId) return true;
            currentId = managerId;
        }
        return false;
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new ForbiddenException('Not authenticated');
        }
        if (user.role?.id && ADMIN_ROLES.has(user.role.id)) {
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
            // Project owner approves their own project's hours.
            if (user.id === projectManager?.id) {
                return true;
            }
            // Line manager approves their direct report's hours.
            if (user.id === lineManager?.id) {
                return true;
            }
            // Senior manager approves anyone in their reporting chain.
            if (user.role?.id === 'SENIOR_MANAGER') {
                if (await this.isInReportingChain(user.id, timesheet.userId)) {
                    return true;
                }
            }
            // Active delegate stands in for either manager.
            if (this.isActiveDelegateFor(user.id, projectManager) || this.isActiveDelegateFor(user.id, lineManager)) {
                return true;
            }
            throw new ForbiddenException(
                'Only the project manager, line manager, a senior manager in the reporting chain, or an active delegate can change timesheet status',
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
