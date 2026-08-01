import type { EventResponse } from '@gmrlog/types';
import { eventCreateSchema, eventInviteSchema, eventRsvpSchema } from '@gmrlog/validators';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import {
  EventCreateDto,
  EventIdParamDto,
  EventInviteDto,
  EventRsvpDto,
  ParticipationDto,
} from './dto/events.dto';
import { EventsService } from './events.service';

/**
 * S1 §13.10 · D3.24 EVENTS_V2 — Events resource. Transport only.
 */
@ApiTags('events')
@ApiBearerAuth('bearer')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(eventCreateSchema)
  createEvent(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: EventCreateDto,
  ): Promise<EventResponse> {
    return this.eventsService.createEvent(playerIdOf(identity), body);
  }

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getEvent(
    @Param() params: EventIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<EventResponse> {
    return this.eventsService.getEvent(params.id, identity);
  }

  @Post(':id/participation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async joinEvent(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: EventIdParamDto,
    @Body() body: ParticipationDto,
  ): Promise<void> {
    void body;
    await this.eventsService.joinEvent(params.id, playerIdOf(identity));
  }

  @Delete(':id/participation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async leaveEvent(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: EventIdParamDto,
  ): Promise<void> {
    await this.eventsService.leaveEvent(params.id, playerIdOf(identity));
  }

  @Post(':id/rsvp')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiZodBody(eventRsvpSchema)
  rsvp(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: EventIdParamDto,
    @Body() body: EventRsvpDto,
  ): Promise<EventResponse> {
    return this.eventsService.rsvp(params.id, playerIdOf(identity), body);
  }

  @Post(':id/invite')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiZodBody(eventInviteSchema)
  async invite(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: EventIdParamDto,
    @Body() body: EventInviteDto,
  ): Promise<void> {
    await this.eventsService.invite(params.id, playerIdOf(identity), body);
  }
}
