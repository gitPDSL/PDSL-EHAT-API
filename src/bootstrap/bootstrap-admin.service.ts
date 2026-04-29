import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, ACCOUNT_STATUS } from 'src/database/postgres/entities/user.entity';
import { RoleEntity } from 'src/database/postgres/entities/role.entity';

@Injectable()
export class BootstrapAdminService implements OnApplicationBootstrap {
    private readonly logger = new Logger(BootstrapAdminService.name);

    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        @InjectRepository(RoleEntity) private readonly roleRepository: Repository<RoleEntity>,
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
        const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
        if (!email || !password) {
            return;
        }

        try {
            const existingAdmin = await this.userRepository
                .createQueryBuilder('u')
                .leftJoin('u.role', 'r')
                .where('r.id IN (:...roleIds)', { roleIds: ['ADMIN', 'SUPER_ADMIN'] })
                .getOne();

            if (existingAdmin) {
                this.logger.log(`Bootstrap admin skipped: ${existingAdmin.email} already exists`);
                return;
            }

            let role = await this.roleRepository.findOneBy({ id: 'ADMIN' });
            if (!role) {
                role = await this.roleRepository.findOneBy({ id: 'SUPER_ADMIN' });
            }
            if (!role) {
                this.logger.warn('Bootstrap admin skipped: no ADMIN or SUPER_ADMIN role found in roles table. Run the role seed first.');
                return;
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const user = this.userRepository.create({
                email,
                fullName: 'Bootstrap Admin',
                passwordHash,
                role,
                status: ACCOUNT_STATUS.ACTIVE,
            } as Partial<UserEntity>);
            await this.userRepository.save(user);
            this.logger.log(`Bootstrap admin created: ${email} (role ${role.id}). Rotate this password after first login.`);
        } catch (error: any) {
            this.logger.error(`Bootstrap admin failed: ${error?.message ?? error}`, error?.stack);
        }
    }
}
