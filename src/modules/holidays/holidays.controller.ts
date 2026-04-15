import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { HolidaysService } from './services/holidays.service';
import { CreateHolidayDto, PartialCreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { HolidayEntity } from 'src/database/postgres/entities/holiday.entity';
import { Roles } from 'src/decorators/roles.decorator';

@Controller('holidays')
export class HolidaysController {
    constructor(private readonly holidaysService: HolidaysService) { }

    @ApiOperation({ summary: 'Create a holiday entry (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateHolidayDto })
    @ApiResponseWrapper(HolidayEntity)
    @Roles('ADMIN')
    @Post()
    create(@Req() req: Request, @Body() dto: CreateHolidayDto): Promise<any> {
        return this.holidaysService.create(dto, req['user']);
    }

    @ApiOperation({ summary: 'List holidays, optionally filtered by year or country' })
    @ApiBearerAuth()
    @ApiResponseWrapper(HolidayEntity, true)
    @Get()
    list(@Query('year') year?: string, @Query('country') country?: string): Promise<any> {
        return this.holidaysService.findAll({
            year: year ? Number(year) : undefined,
            country,
        });
    }

    @ApiOperation({ summary: 'Get a holiday entry' })
    @ApiBearerAuth()
    @ApiResponseWrapper(HolidayEntity)
    @Get(':id')
    get(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.holidaysService.findById(id);
    }

    @ApiOperation({ summary: 'Update a holiday entry (admin only)' })
    @ApiBearerAuth()
    @ApiBody({ type: PartialCreateHolidayDto })
    @ApiResponseWrapper(HolidayEntity)
    @Roles('ADMIN')
    @Put(':id')
    update(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHolidayDto): Promise<any> {
        return this.holidaysService.update(id, dto, req['user']);
    }

    @ApiOperation({ summary: 'Delete a holiday entry (admin only)' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Roles('ADMIN')
    @Delete(':id')
    delete(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.holidaysService.remove(id);
    }
}
