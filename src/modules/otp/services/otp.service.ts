import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpEntity } from 'src/database/postgres/entities/otp.entity';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { UpdateOtpDto } from '../dto/update-otp.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class OtpService {
    constructor(
        @InjectRepository(OtpEntity) private readonly otpRepository: Repository<OtpEntity>
    ) {
    }
    async create(otpData: Partial<OtpEntity>, currentUser: UserEntity | null = null) {
        try {
            if (currentUser && currentUser.id) {
                otpData['updatedBy'] = currentUser;
            }
            const otp = await this.otpRepository.save(await this.otpRepository.create(otpData))
            return otp;
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
    async update(id: string, otpData: Partial<UpdateOtpDto>, currentUser: UserEntity | null = null) {
        try {
            let otp = await this.otpRepository.findOne({ where: { id } }) || {};
            Object.keys(otpData).map(key => {
                otp[key] = otpData[key];
            });
            if (currentUser && currentUser.id) {
                otp['updatedBy'] = currentUser;
            }
            await this.otpRepository.save(otp);
            // console.log('update otp', otp)
            return otp;
        } catch (error) {
            console.log('error-----', error, otpData)
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findAll(query: any = {}) {
        try {
            const otps = await this.otpRepository.find(query);
            return otps;
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
            const otp = await this.otpRepository.findOneBy({ id });
            return otp;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Object, selectFields: string = '') {
        try {
            const otp = await this.otpRepository.findOne({ where: query });
            return otp;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async remove(id: string) {
        try {
            const otp = await this.otpRepository.delete(id);
            return otp;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

}
