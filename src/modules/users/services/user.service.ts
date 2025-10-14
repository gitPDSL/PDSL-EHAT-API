import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/database/postgres/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { ACCOUNT_STATUS } from 'src/constants/account.constants';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
        private mailService: MailService,
        private jwtService: JwtService,
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
        await this.mailService.sendAccountVerification(user.email, user.fullName, process.env.APP_URL + '/verify/' + token, process.env.APP_URL);

    }
    async sendForgotPasswordMail(user: any) {
        const token = await this.jwtService.signAsync({ sub: user.id, email: user.email }, {
            expiresIn: '15m',
        });
        await this.mailService.sendForgotPassword(user.email, user.fullName, process.env.APP_URL + '/reset-password/' + token);

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
            return user;
        } catch (error) {
            console.log(error);
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
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
            if (userData.manager)
                userData.manager = { id: userData.manager };
            if (userData.department)
                userData.department = { id: userData.department };
            let user = await this.userRepository.findOne({ where: { id } }) || {};
            Object.keys(userData).map(key => {
                user[key] = userData[key];
            })
            await this.userRepository.save(user);
            // console.log('update user', user)
            return await this.userRepository.findOne({ where: { id } }) || {};
        } catch (error) {
            console.log('error-----', error, userData)
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
            let userList: any = [];
            if (userData.role)
                userData.role = { id: userData.role };
            if (userData.manager)
                userData.manager = { id: userData.manager };
            if (userData.department)
                userData.department = { id: userData.department };
            for (let user of users) {
                if (userData.password) {
                    userData['passwordHash'] = await bcrypt.hash(userData.password, 10);
                    delete userData.password;
                }

                Object.assign(user, {
                    ...userData,
                    updatedBy: currentUser,
                });
                // console.log(user)
                user = await this.userRepository.save(user);
                userList.push(user);
            }
            return userList;
        } catch (err) {
            console.log('--=--==-', err);
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
            const user = await this.userRepository.delete(id);
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
