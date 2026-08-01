import type { CollectionResponse } from '@gmrlog/types';
import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import { CollectionEntriesService } from './collection-entries.service';
import { CollectionEntriesPutDto, CollectionIdParamDto } from './dto/collection.dto';

/**
 * S1 §13.8 — `PUT /collections/{id}/entries` replace/reorder.
 * There are no POST/DELETE entry routes in S1.
 */
@ApiTags('collections')
@ApiBearerAuth('bearer')
@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionEntriesController {
  constructor(private readonly entriesService: CollectionEntriesService) {}

  @Put(':id/entries')
  replaceEntries(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
    @Body() body: CollectionEntriesPutDto,
  ): Promise<CollectionResponse> {
    return this.entriesService.replaceEntries(params.id, playerIdOf(identity), body);
  }
}
