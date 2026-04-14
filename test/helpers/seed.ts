import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleEntity } from '../../src/database/postgres/entities/role.entity';
import { TimesheetStatusEntity } from '../../src/database/postgres/entities/timesheet-status.entity';
import { UserEntity, ACCOUNT_STATUS } from '../../src/database/postgres/entities/user.entity';
import { ProjectEntity } from '../../src/database/postgres/entities/project.entity';

export const TEST_USER_PASSWORD = 'Password123!';

export async function seedBase(dataSource: DataSource, emailPrefix: string) {
    const roleRepo = dataSource.getRepository(RoleEntity);
    const statusRepo = dataSource.getRepository(TimesheetStatusEntity);
    const userRepo = dataSource.getRepository(UserEntity);

    await roleRepo.save([
        { id: 'USER', name: 'User', description: 'Regular user' },
        { id: 'MANAGER', name: 'Manager', description: 'Manager' },
        { id: 'ADMIN', name: 'Admin', description: 'Admin' },
    ]);

    await statusRepo.save([
        { id: 'PENDING', name: 'Pending', description: 'Pending' },
        { id: 'SUBMITTED', name: 'Submitted', description: 'Submitted' },
        { id: 'APPROVED', name: 'Approved', description: 'Approved' },
        { id: 'REJECTED', name: 'Rejected', description: 'Rejected' },
        { id: 'DRAFT', name: 'Draft', description: 'Draft' },
    ]);

    const email = `${emailPrefix}@test.local`;
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
        return { user: existing };
    }
    const user = await userRepo.save(userRepo.create({
        email,
        fullName: 'Test User',
        passwordHash: await bcrypt.hash(TEST_USER_PASSWORD, 10),
        role: { id: 'ADMIN' } as any,
        status: ACCOUNT_STATUS.ACTIVE,
    }));
    return { user };
}

export async function seedProject(dataSource: DataSource, manager: UserEntity): Promise<ProjectEntity> {
    const projectRepo = dataSource.getRepository(ProjectEntity);
    return projectRepo.save(projectRepo.create({
        name: 'Test Project',
        description: 'e2e test project',
        allocatedHours: 100,
        manager,
    } as Partial<ProjectEntity>));
}

export async function seedRegularUser(dataSource: DataSource, emailPrefix: string) {
    const userRepo = dataSource.getRepository(UserEntity);
    const email = `${emailPrefix}-regular@test.local`;
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) return existing;
    return userRepo.save(userRepo.create({
        email,
        fullName: 'Regular Test User',
        passwordHash: await bcrypt.hash(TEST_USER_PASSWORD, 10),
        role: { id: 'USER' } as any,
        status: ACCOUNT_STATUS.ACTIVE,
    }));
}
