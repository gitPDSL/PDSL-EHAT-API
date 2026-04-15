import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { TimesheetEntity } from 'src/database/postgres/entities/timesheet.entity';
import { ClientEntity } from 'src/database/postgres/entities/client.entity';
import { ProjectUserEntity } from 'src/database/postgres/entities/project-user.entity';

export interface InvoiceExportParams {
    clientId: string;
    year: number;
    month: number; // 1-12
}

@Injectable()
export class ExportsService {
    private readonly logger = new Logger(ExportsService.name);

    constructor(
        @InjectRepository(TimesheetEntity) private readonly timesheetRepository: Repository<TimesheetEntity>,
        @InjectRepository(ClientEntity) private readonly clientRepository: Repository<ClientEntity>,
        @InjectRepository(ProjectUserEntity) private readonly projectUserRepository: Repository<ProjectUserEntity>,
    ) { }

    async generateInvoiceWorkbook(params: InvoiceExportParams): Promise<{ buffer: Buffer; filename: string; currency: string; total: number }> {
        if (!params.clientId) throw new BadRequestException('clientId is required');
        if (!params.year || !params.month) throw new BadRequestException('year and month are required');
        if (params.month < 1 || params.month > 12) throw new BadRequestException('month must be between 1 and 12');

        const client = await this.clientRepository.findOne({ where: { id: params.clientId } });
        if (!client) throw new NotFoundException('Client not found');

        const start = moment({ year: params.year, month: params.month - 1, day: 1 }).startOf('day').toDate();
        const end = moment(start).endOf('month').toDate();

        const timesheets = await this.timesheetRepository.find({
            where: {
                date: Between(start, end),
                project: { client: { id: params.clientId } as any } as any,
            } as any,
            relations: ['user', 'project', 'project.client', 'status'],
        });

        const projectUserRates = await this.projectUserRepository.find();
        const rateLookup = new Map<string, number>();
        for (const pu of projectUserRates) {
            rateLookup.set(`${pu.projectId}|${pu.userId}`, Number(pu.hourlyRate) || 0);
        }

        const rows: Array<{
            date: string;
            employee: string;
            project: string;
            hours: number;
            rate: number;
            billable: string;
            amount: number;
            note: string;
        }> = [];

        let totalAmount = 0;
        for (const ts of timesheets) {
            const t: any = ts;
            const isBillable = t.billable === null || t.billable === undefined ? t.project?.billable !== false : t.billable === true;
            if (!isBillable) continue;
            const hours = Number(t.hours) || 0;
            const rate = rateLookup.get(`${t.projectId}|${t.userId}`) ?? 0;
            const amount = Math.round(hours * rate * 100) / 100;
            totalAmount += amount;
            rows.push({
                date: moment(t.date).format('YYYY-MM-DD'),
                employee: t.user?.fullName ?? '-',
                project: t.project?.name ?? '-',
                hours,
                rate,
                billable: 'Yes',
                amount,
                note: t.note ?? '',
            });
        }

        const workbook = XLSX.utils.book_new();
        const headerRow = ['Date', 'Employee', 'Project', 'Hours', `Rate (${client.currency})`, 'Billable', `Amount (${client.currency})`, 'Note'];
        const dataRows = rows.map((r) => [r.date, r.employee, r.project, r.hours, r.rate, r.billable, r.amount, r.note]);
        const totalRow = ['', '', '', '', '', 'Total', Math.round(totalAmount * 100) / 100, ''];
        const aoa = [headerRow, ...dataRows, [], totalRow];
        const sheet = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(workbook, sheet, 'Invoice');

        const buffer: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const filename = `invoice-${client.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${params.year}-${String(params.month).padStart(2, '0')}.xlsx`;
        return { buffer, filename, currency: client.currency, total: Math.round(totalAmount * 100) / 100 };
    }
}
