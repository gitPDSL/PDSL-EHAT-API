import { Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { ApiResponseWrapper } from 'src/utills/api-response-wrapper.helper';
import { NotificationEntity } from 'src/database/postgres/entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) { }

    @ApiOperation({ summary: 'List notifications for the current user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(NotificationEntity, true)
    @Get()
    list(
        @Req() req: Request,
        @Query('unread') unread?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<any> {
        return this.notifications.listForUser(req['user'].id, {
            unreadOnly: unread === 'true',
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
        });
    }

    @ApiOperation({ summary: 'Mark a single notification as read' })
    @ApiBearerAuth()
    @ApiResponseWrapper(NotificationEntity)
    @Put(':id/read')
    markRead(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.notifications.markRead(req['user'].id, id);
    }

    @ApiOperation({ summary: 'Mark all notifications as read for the current user' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Put('read-all')
    markAllRead(@Req() req: Request): Promise<any> {
        return this.notifications.markAllRead(req['user'].id);
    }

    @ApiOperation({ summary: 'Dismiss a single notification' })
    @ApiBearerAuth()
    @ApiResponseWrapper(class { })
    @Delete(':id')
    remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string): Promise<any> {
        return this.notifications.remove(req['user'].id, id);
    }
}
