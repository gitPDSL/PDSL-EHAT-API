import { SetMetadata } from '@nestjs/common';

export const EMPLOYMENT_KEY = 'employment';

/**
 * Restrict an endpoint to specific employment types.
 * Example: @RequireEmployment('EMPLOYEE') on the leave controllers,
 * since contractors don't accrue or take leave.
 *
 * Admins (ADMIN / SUPER_ADMIN) bypass this check inside the guard so
 * they can administer everyone regardless of how they were classified.
 */
export const RequireEmployment = (...types: string[]) => SetMetadata(EMPLOYMENT_KEY, types);
