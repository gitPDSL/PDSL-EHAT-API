import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OtpEntity } from 'src/database/postgres/entities/otp.entity';
import { Repository } from 'typeorm';
import { UpdateOtpDto } from '../dto/otp.dto';
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
    async findAll(query: Record<string, any> = {}) {
        try {
            const { page, limit, sortBy, order, relations, select, ...filter } = query;
            const sortOrder = {};
            if (sortBy)
                sortOrder[sortBy] = order;
            const otps = page ? await this.otpRepository.find({ where: filter, order: sortOrder, skip: (page - 1) * limit, take: limit, relations: relations || [], select:select?._value||select }) : await this.otpRepository.find({ where: filter, relations: relations || [], select:select?._value||select });
            return otps;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }

    async findById(id: string, relations: string[] = []) {
        try {
            const otp = await this.otpRepository.findOne({ where: { id }, relations });
            return otp;
        } catch (error) {
            if (error.name == 'ValidationError') {
                throw new BadRequestException(error.errors);
            }
            throw error;
        }
    }
    async findOne(query: Record<string, any>) {
        try {
            const { relations, ...filter } = query;
            const otp = await this.otpRepository.findOne({ where: filter, relations: relations || [] });
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
