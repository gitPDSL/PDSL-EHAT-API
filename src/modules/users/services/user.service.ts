import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
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
        const token = await this.jwtService.signAsync({ sub: user._id, email: user.email }, {
            expiresIn: '15m',
        });
        await this.mailService.sendAccountVerification(user.email, user.fullName, process.env.APP_URL + '/verify/' + token);

    }
    async sendForgotPasswordMail(user: any) {
        const token = await this.jwtService.signAsync({ sub: user._id, email: user.email }, {
            expiresIn: '15m',
        });
        await this.mailService.sendForgotPassword(user.email, user.fullName, process.env.APP_URL + '/reset/' + token);

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
            const newUser = await this.userRepository.save(user)
            if (userData.status == ACCOUNT_STATUS.PENDING)
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
            return user;
        } catch (error) {
            console.log('error-----', error, userData)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const users = await this.userRepository.find(query);
            return users;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, refreshToken: boolean = false) {
        try {
            // let selectFields: string = 'firstName lastNeme email accountType status createdAt updatedAt' + (refreshToken ? ' refreshToken' : '');
            const user = await this.userRepository.findOneBy({ id });
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const user = await this.userRepository.findOne({ where: query });
            return user;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
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
