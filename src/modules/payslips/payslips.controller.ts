import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    Req,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { RequireEmployment } from 'src/decorators/employment.decorator';
import { PayslipsService } from './payslips.service';

@Controller('payslips')
export class PayslipsController {
    constructor(private readonly payslipsService: PayslipsService) { }

    @ApiOperation({ summary: 'Upload (or replace) a payslip PDF for a (user, payrollPeriod). Admin only.' })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                userId: { type: 'string' },
                payrollPeriodId: { type: 'string' },
            },
        },
    })
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @Req() req: Request,
        @UploadedFile() file: any,
        @Body('userId') userId: string,
        @Body('payrollPeriodId') payrollPeriodId: string,
    ): Promise<any> {
        if (!file) throw new BadRequestException('file is required');
        return this.payslipsService.upload(
            {
                userId,
                payrollPeriodId,
                filename: file.originalname ?? 'payslip.pdf',
                contentType: file.mimetype ?? 'application/pdf',
                sizeBytes: file.size ?? file.buffer?.length ?? 0,
                buffer: file.buffer,
            },
            req['user'],
        );
    }

    @ApiOperation({ summary: 'List payslips. Non-admins are scoped to their own. Optional filters: userId, payrollPeriodId.' })
    @ApiBearerAuth()
    @RequireEmployment('EMPLOYEE')
    @Get()
    async list(
        @Req() req: Request,
        @Query('userId') userId?: string,
        @Query('payrollPeriodId') payrollPeriodId?: string,
    ): Promise<any> {
        return this.payslipsService.list({ userId, payrollPeriodId }, req['user']);
    }

    @ApiOperation({ summary: 'Download a payslip PDF. Owner or admin only.' })
    @ApiBearerAuth()
    @RequireEmployment('EMPLOYEE')
    @Get(':id/download')
    async download(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ): Promise<void> {
        const { payslip, bytes } = await this.payslipsService.download(id, req['user']);
        res.setHeader('Content-Type', payslip.contentType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${payslip.filename}"`);
        res.setHeader('Content-Length', String(bytes.length));
        res.end(bytes);
    }

    @ApiOperation({ summary: 'Delete a payslip. Admin only.' })
    @ApiBearerAuth()
    @Roles('SUPER_ADMIN', 'ADMIN')
    @Delete(':id')
    async remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        await this.payslipsService.remove(id, req['user']);
        return { message: 'deleted' };
    }
}
