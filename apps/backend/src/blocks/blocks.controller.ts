import type { BlockResponse } from '@gmrlog/types';
import { blockCreateSchema } from '@gmrlog/validators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { BlocksService } from './blocks.service';
import { BlockCreateDto, BlocksListQueryDto, BlockUserIdParamDto } from './dto/block.dto';

/**
 * S1 §13.13 — Block mutations + §15's Blocked tab. Transport only.
 */
@ApiTags('blocks')
@ApiBearerAuth('bearer')
@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listBlocked(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: BlocksListQueryDto,
  ): Promise<PaginatedPayload<BlockResponse>> {
    return this.blocksService.listBlocked(playerIdOf(identity), query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Idempotent()
  @ApiZodBody(blockCreateSchema)
  blockUser(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: BlockCreateDto,
  ): Promise<BlockResponse> {
    return this.blocksService.blockUser(playerIdOf(identity), body);
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unblockUser(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: BlockUserIdParamDto,
  ): Promise<void> {
    await this.blocksService.unblockUser(playerIdOf(identity), params.userId);
  }
}
