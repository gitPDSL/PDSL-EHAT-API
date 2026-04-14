import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const req = context.switchToHttp().getRequest();
        const roleId: string | undefined = req.user?.role?.id;
        if (!roleId) {
            throw new ForbiddenException('No role assigned');
        }
        if (!requiredRoles.includes(roleId)) {
            throw new ForbiddenException(
                `Role ${roleId} is not permitted on this endpoint`,
            );
        }
        return true;
    }
}
