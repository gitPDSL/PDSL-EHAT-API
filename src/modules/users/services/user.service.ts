import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { ACCOUNT_STATUS } from 'src/constants/account.constants';
import { AuditService } from 'src/modules/audit/audit.service';
import { LeaveBalanceService } from 'src/modules/leaveBalance/services/leave-balance.service';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { LeaveEntity } from 'src/database/postgres/entities/leave.entity';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private mailService: MailService,
        private jwtService: JwtService,
        private readonly auditService: AuditService,
        private readonly leaveBalanceService: LeaveBalanceService,
    ) {
    }
    async findByEmailAndPassword(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { email }, select: [
                'id',
                'passwordHash', // explicitly include password
                'fullName',
                'email',
                'role',
                'status'
            ],
        });
        if (user && await bcrypt.compare(password, user.passwordHash)) {
            return user;
        }
        throw new UnauthorizedException('Invalid credentials');
    }
    async sendVerificationMail(user: any) {
        // console.log(user);
        const token = await this.jwtService.signAsync({ sub: user.id, email: user.email }, {
            expiresIn: '15m',
        });
        await this.mailService.sendAccountVerification(user.email, user.fullName, process.env.APP_URL + '/verify/' + token, process.env.APP_URL + '/');

    }
    async sendForgotPasswordMail(user: any) {
        const token = await this.jwtService.signAsync({ sub: user.id, email: user.email }, {
            expiresIn: '15m',
        });
        await this.mailService.sendForgotPassword(user.email, user.fullName, process.env.APP_URL + '/reset-password/' + token, process.env.APP_URL + '/');

    }

    async resendVerification(id: string, currentUser: UserEntity | null = null) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.email) throw new BadRequestException('User has no email on record');
        if (user.status === ACCOUNT_STATUS.ACTIVE) {
            throw new BadRequestException('User is already active, no verification needed');
        }
        await this.sendVerificationMail(user);
        await this.auditService.log({
            actorId: currentUser?.id ?? null,
            action: 'user.verification.resend',
            entityType: 'User',
            entityId: id,
            before: { status: user.status },
            after: { status: user.status },
        });
        return { message: 'Verification email resent' };
    }

    async forceVerify(id: string, currentUser: UserEntity | null = null) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        if (user.status === ACCOUNT_STATUS.ACTIVE) {
            return { message: 'User is already active' };
        }
        const prevStatus = user.status;
        (user as any).status = ACCOUNT_STATUS.ACTIVE;
        (user as any).updatedBy = currentUser;
        await this.userRepository.save(user);
        await this.auditService.log({
            actorId: currentUser?.id ?? null,
            action: 'user.verification.force',
            entityType: 'User',
            entityId: id,
            before: { status: prevStatus },
            after: { status: ACCOUNT_STATUS.ACTIVE },
        });
        return { message: 'User force-verified and activated' };
    }
    async create(data: Partial<CreateUserDto>, currentUser: UserEntity | null = null) {
        try {
            const userData: any = data;
            if (userData.password) {
                userData['passwordHash'] = await bcrypt.hash(userData.password, 10);
                delete userData.password;
            }
            if (currentUser && currentUser.id) {
                userData.createdBy = currentUser;
            }
            if (userData.role)
                userData.role = { id: userData.role };
            if (userData.manager)
                userData.manager = { id: userData.manager };
            if (userData.department)
                userData.department = { id: userData.department };
            const user = await this.userRepository.create(userData);
            const newUser: any = await this.userRepository.save(user)
            if (newUser.status == ACCOUNT_STATUS.PENDING)
                await this.sendVerificationMail(newUser);
            try {
                await this.leaveBalanceService.provisionForUser(newUser.id);
            } catch (provisionError: any) {
                this.logger.error(
                    `Failed to provision leave balances for new user ${newUser.id}: ${provisionError?.message ?? provisionError}`,
                    provisionError?.stack,
                );
            }
            return user;
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    private async assertNoManagerCycle(userId: string, newManagerId: string): Promise<void> {
        if (userId === newManagerId) {
            throw new BadRequestException('A user cannot be their own manager');
        }
        let currentId: string | null = newManagerId;
        const visited = new Set<string>();
        while (currentId) {
            if (currentId === userId) {
                throw new BadRequestException('Assigning this manager would create a circular manager relationship');
            }
            if (visited.has(currentId)) {
                throw new BadRequestException('Existing manager chain already contains a cycle');
            }
            visited.add(currentId);
            const mgr: any = await this.userRepository.findOne({
                where: { id: currentId },
                relations: ['manager'],
            });
            currentId = mgr?.manager?.id ?? null;
        }
    }
    async update(id: string, data: Partial<UpdateUserDto>, currentUser: UserEntity | null = null) {
        const userData: any = data;
        try {
            if (userData.password) {
                userData['passwordHash'] = await bcrypt.hash(userData.password, 10);
                delete userData.password;
            }
            if (currentUser && currentUser.id) {
                userData.updatedBy = currentUser;
            }
            if (userData.role)
                userData.role = { id: userData.role };
            if (userData.manager) {
                await this.assertNoManagerCycle(id, userData.manager);
                userData.manager = { id: userData.manager };
            }
            if (userData.department)
                userData.department = { id: userData.department };
            let user: any = await this.userRepository.findOne({ where: { id }, relations: ['role'] }) || {};
            const prevRoleId: string | null = user?.role?.id ?? null;
            Object.keys(userData).map(key => {
                user[key] = userData[key];
            })
            await this.userRepository.save(user);
            const nextRoleId: string | null = user?.role?.id ?? null;
            if (userData.role && prevRoleId !== nextRoleId) {
                await this.auditService.log({
                    actorId: currentUser?.id ?? null,
                    action: 'user.role.change',
                    entityType: 'User',
                    entityId: id,
                    before: { role: prevRoleId },
                    after: { role: nextRoleId },
                });
            }
            return await this.userRepository.findOne({ where: { id } }) || {};
        } catch (error) {
            this.logger.error(error?.message ?? String(error), error?.stack);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async bulkUpdate(
        query: Record<string, any> = {},
        data: Partial<UpdateUserDto>,
        currentUser: UserEntity | any
    ): Promise<UserEntity[] | UserEntity> {
        if (!query || Object.keys(query).length === 0 || Array.isArray(query)) {
            throw new BadRequestException('Valid query object is required when no IDs are provided.');
        }
        const userData: any = data;
        // console.log('-------------------', query, userData)
        try {
            if (query.role)
                query.role = { id: query.role };
            if (query.manager)
                query.manager = { id: query.manager };
            if (query.department)
                query.department = { id: query.department };
            const users = await this.userRepository.find({ where: query, relations: ['department', 'role', 'manager'] });
            // console.log('====================', users)
            if (!users) throw new NotFoundException('No user found matching the query.');
            if (userData.role)
                userData.role = { id: userData.role };
            if (userData.manager)
                userData.manager = { id: userData.manager };
            if (userData.department)
                userData.department = { id: userData.department };
            const userList = await this.dataSource.transaction(async (manager) => {
                const saved: any[] = [];
                for (let user of users) {
                    if (userData.password) {
                        userData['passwordHash'] = await bcrypt.hash(userData.password, 10);
                        delete userData.password;
                    }
                    Object.assign(user, {
                        ...userData,
                        updatedBy: currentUser,
                    });
                    user = await manager.save(user);
                    saved.push(user);
                }
                return saved;
            });
            return userList;
        } catch (err) {
            this.logger.error(err?.message ?? String(err), err?.stack);
            return []
        }
    }
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, password, ...filter
            } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            if (filter.role)
                filter.role = { id: filter.role };
            if (filter.manager)
                filter.manager = { id: filter.manager };
            if (filter.department)
                filter.department = { id: filter.department };
            // console.log(select, { where: filter, relations: relations || [], select })
            const users = page ? await this.userRepository.find({
                where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select
            }) : await this.userRepository.find({ where: filter, relations: relations || [], select });
            // console.log(users)
            return password ? users.filter((a: any) => bcrypt.compareSync(password, a.passwordHash)) : users;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, refreshToken: boolean = false, relations: string[] = []) {
        try {
            // let selectFields: string = 'firstName lastNeme email accountType status createdAt updatedAt' + (refreshToken ? ' refreshToken' : '');
            const user = await this.userRepository.findOne({ where: { id }, relations: relations });
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Record<string, any>, selectFields: string = '') {
        try {
            const { relations, ...filter } = query;
            if (filter.password) {
                filter['passwordHash'] = await bcrypt.hash(filter.password, 10);
                delete filter.password;
            }
            if (filter.role)
                filter.role = { id: filter.role };
            if (filter.manager)
                filter.manager = { id: filter.manager };
            if (filter.department)
                filter.department = { id: filter.department };
            const user = await this.userRepository.findOne({ where: filter, relations: relations || [] });
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string, currentUser: any) {
        try {
            const user = await this.userRepository.softDelete(id);
            await this.auditService.log({
                actorId: currentUser?.id ?? null,
                action: 'user.archive',
                entityType: 'User',
                entityId: id,
                before: { deletedAt: null },
                after: { deletedAt: new Date().toISOString() },
            });
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async dataExport(id: string) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['role', 'department', 'manager'],
            withDeleted: true,
        });
        if (!user) throw new NotFoundException('User not found');
        const { passwordHash, refreshToken, ...safe } = user as any;
        const timesheets = await this.dataSource
            .getRepository(TimesheetEntity)
            .find({ where: { userId: id } });
        const leaves = await this.dataSource
            .getRepository(LeaveEntity)
            .find({ where: { user: { id } } as any, relations: ['leaveType', 'status'] });
        const auditEntries = await this.auditService.findAllForUser(id);
        return {
            generatedAt: new Date().toISOString(),
            user: safe,
            timesheets,
            leaves,
            auditEntries,
        };
    }

    async erase(id: string, currentUser: any) {
        const user: any = await this.userRepository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!user) throw new NotFoundException('User not found');
        const before = {
            fullName: user.fullName,
            email: user.email,
            hadPassword: !!user.passwordHash,
            hadRefreshToken: !!user.refreshToken,
        };
        user.fullName = '[erased]';
        user.email = null;
        user.passwordHash = null;
        user.refreshToken = null;
        if (!user.deletedAt) {
            user.deletedAt = new Date();
        }
        await this.userRepository.save(user);
        await this.auditService.log({
            actorId: currentUser?.id ?? null,
            action: 'user.erase',
            entityType: 'User',
            entityId: id,
            before,
            after: { fullName: '[erased]', email: null, hadPassword: false, hadRefreshToken: false },
        });
        return { message: 'User anonymized' };
    }

}
