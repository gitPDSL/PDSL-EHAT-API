import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EMPLOYMENT_KEY } from '../decorators/employment.decorator';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

@Injectable()
export class EmploymentTypeGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(
            EMPLOYMENT_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!required || required.length === 0) return true;
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) throw new ForbiddenException('Not authenticated');
        // Admins bypass — they administer every type of user.
        if (user.role?.id && ADMIN_ROLES.has(user.role.id)) return true;
        const employmentType: string | undefined = user.employmentType;
        if (!employmentType || !required.includes(employmentType)) {
            throw new ForbiddenException(
                `This endpoint is not available for ${employmentType ?? 'unclassified'} users`,
            );
        }
        return true;
    }
}
