import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PayrollService } from './services/payroll.service';
import { CreatePayrollPeriodDto, PartialCreatePayrollPeriodDto, UpdatePayrollPeriodDto } from './dto/payroll-period.dto';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { PayrollPeriodEntity } from 'src/database/postgres/entities/payroll-period.entity';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('payroll-periods')
export class PayrollController {
    constructor(private readonly payrollService: PayrollService) { }

    @ApiOperation({ summary: 'Create a payroll period (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreatePayrollPeriodDto })
    @ApiResponseWrapper(PayrollPeriodEntity)
    @Roles('ADMIN')
    @Post()
    create(@Req() req: Request, @Body() dto: CreatePayrollPeriodDto): Promise<any> {
        return this.payrollService.create(dto, req['user']);
    }

    @ApiOperation({ summary: 'List payroll periods' })
    @ApiBearerAuth()
    @ApiResponseWrapper(PayrollPeriodEntity, true)
    @Get()
    list(): Promise<any> {
        return this.payrollService.findAll();
    }

    @ApiOperation({ summary: 'Get a payroll period' })
    @ApiBearerAuth()
    @ApiResponseWrapper(PayrollPeriodEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.payrollService.findById(id);
    }

    @ApiOperation({ summary: 'Update or lock/unlock a payroll period (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreatePayrollPeriodDto })
    @ApiResponseWrapper(PayrollPeriodEntity)
    @Roles('ADMIN')
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePayrollPeriodDto): Promise<any> {
        return this.payrollService.update(id, dto, req['user']);
    }

    @ApiOperation({ summary: 'Delete a payroll period (admin only). Locked periods cannot be deleted.' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.payrollService.remove(id);
    }
}
