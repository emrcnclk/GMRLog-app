import type { NotificationResponse } from '@gmrlog/types';
import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { NotificationListQueryDto, NotificationsReadDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

/**
 * S1 §13.11 — Notifications resource. Transport only.
 * Mark-read is `POST /notifications/read` (not PATCH-by-id).
 */
@ApiTags('notifications')
@ApiBearerAuth('bearer')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: NotificationListQueryDto,
  ): Promise<PaginatedPayload<NotificationResponse>> {
    return this.notificationsService.listNotifications(playerIdOf(identity), query);
  }

  @Post('read')
  @HttpCode(204)
  async markRead(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: NotificationsReadDto,
  ): Promise<void> {
    await this.notificationsService.markRead(playerIdOf(identity), body);
  }
}
