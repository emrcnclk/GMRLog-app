import type { ConversationResponse, MessageResponse } from '@gmrlog/types';
import { messageCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import {
  ConversationCreateDto,
  ConversationIdParamDto,
  MessageCreateDto,
  MessageListQueryDto,
} from './dto/messaging.dto';
import { MessagingService } from './messaging.service';
/**
 * S1 Â§13.11 â€” Conversations resource. Transport only.
 * All routes require an authenticated player (P).
 */
@ApiTags('messaging')
@ApiBearerAuth('bearer')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}
  @Get()
  listConversations(@CurrentUser() identity: RequestIdentity): Promise<ConversationResponse[]> {
    return this.messagingService.listConversations(playerIdOf(identity));
  }
  @Post()
  createConversation(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: ConversationCreateDto,
  ): Promise<ConversationResponse> {
    return this.messagingService.createConversation(playerIdOf(identity), body);
  }
  @Get(':id/messages')
  listMessages(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ConversationIdParamDto,
    @Query() query: MessageListQueryDto,
  ): Promise<PaginatedPayload<MessageResponse>> {
    return this.messagingService.listMessages(params.id, playerIdOf(identity), query);
  }
  @Post(':id/messages')
  @Idempotent()
  @ApiZodBody(messageCreateSchema)
  sendMessage(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ConversationIdParamDto,
    @Body() body: MessageCreateDto,
  ): Promise<ConversationResponse> {
    return this.messagingService.sendMessage(params.id, playerIdOf(identity), body);
  }
  @Get(':id')
  getConversation(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: ConversationIdParamDto,
  ): Promise<ConversationResponse> {
    return this.messagingService.getConversation(params.id, playerIdOf(identity));
  }
}
