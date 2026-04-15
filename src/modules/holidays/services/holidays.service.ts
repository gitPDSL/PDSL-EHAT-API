import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { HolidayEntity } from 'src/database/postgres/entities/holiday.entity';
import { CreateHolidayDto, UpdateHolidayDto } from '../dto/holiday.dto';
import { UserEntity } from 'src/database/postgres/entities/user.entity';

@Injectable()
export class HolidaysService {
    private readonly logger = new Logger(HolidaysService.name);

    constructor(
        @InjectRepository(HolidayEntity) private readonly repo: Repository<HolidayEntity>,
    ) { }

    async create(data: CreateHolidayDto, currentUser: UserEntity | null = null): Promise<HolidayEntity> {
        const entity = this.repo.create({
            date: data.date,
            name: data.name,
            country: (data.country ?? 'GB').toUpperCase(),
            createdBy: currentUser ?? undefined,
        } as any);
        try {
            const saved: HolidayEntity = await this.repo.save(entity as any);
            return saved;
        } catch (error: any) {
            if (error?.code === '23505') {
                throw new BadRequestException('A holiday already exists on that date for that country');
            }
            throw error;
        }
    }

    async findAll(query: { year?: number; country?: string } = {}): Promise<HolidayEntity[]> {
        const country = query.country ? query.country.toUpperCase() : undefined;
        const where: any = {};
        if (country) where.country = country;
        if (query.year) {
            where.date = Between(`${query.year}-01-01`, `${query.year}-12-31`);
        }
        return this.repo.find({ where, order: { date: 'ASC' } });
    }

    async findById(id: string): Promise<HolidayEntity> {
        const h = await this.repo.findOne({ where: { id } });
        if (!h) throw new NotFoundException('Holiday not found');
        return h;
    }

    async findDatesInRange(start: string, end: string, country: string = 'GB'): Promise<Set<string>> {
        const rows = await this.repo.find({
            where: { country: country.toUpperCase(), date: Between(start, end) },
        });
        const set = new Set<string>();
        for (const row of rows) {
            set.add(String(row.date).slice(0, 10));
        }
        return set;
    }

    async update(id: string, data: UpdateHolidayDto, currentUser: UserEntity | null = null): Promise<HolidayEntity> {
        const h: any = await this.findById(id);
        if (data.date !== undefined) h.date = data.date;
        if (data.name !== undefined) h.name = data.name;
        if (data.country !== undefined) h.country = data.country.toUpperCase();
        if (currentUser) h.updatedBy = currentUser;
        try {
            const saved: HolidayEntity = await this.repo.save(h);
            return saved;
        } catch (error: any) {
            if (error?.code === '23505') {
                throw new BadRequestException('A holiday already exists on that date for that country');
            }
            throw error;
        }
    }

    async remove(id: string) {
        await this.findById(id);
        return this.repo.delete(id);
    }
}
