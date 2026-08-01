import type { CollectionResponse, UserPublicResponse } from '@gmrlog/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { CollectionDiscoverService } from './collection-discover.service';
import { CollectionsService } from './collections.service';
import {
  CollectionCreateDto,
  CollectionIdParamDto,
  CollectionPatchDto,
  CollectionsDiscoverQueryDto,
  CollectionsQueryDto,
} from './dto/collection.dto';

/**
 * S1 §13.8 / D3.22 — Collections resource. Transport only.
 * Entry replace lives on CollectionEntriesController (`PUT .../entries`).
 */
@ApiTags('collections')
@ApiBearerAuth('bearer')
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly collectionsService: CollectionsService,
    private readonly collectionDiscoverService: CollectionDiscoverService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  listCollections(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CollectionsQueryDto,
  ): Promise<CollectionResponse[]> {
    return this.collectionsService.listCollections(playerIdOf(identity), query);
  }

  /** D3.24 Collection Hub — must be registered before `:id` to avoid route capture. */
  @Get('discover')
  @UseGuards(OptionalGuestGuard)
  discoverCollections(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: CollectionsDiscoverQueryDto,
  ): Promise<PaginatedPayload<CollectionResponse>> {
    const viewerId = identity.class === 'player' ? identity.userId : null;
    return this.collectionDiscoverService.discover(query, viewerId);
  }

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getCollection(
    @Param() params: CollectionIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<CollectionResponse> {
    return this.collectionsService.getCollection(params.id, identity);
  }

  @Get(':id/followers')
  @UseGuards(OptionalGuestGuard)
  listFollowers(
    @Param() params: CollectionIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<UserPublicResponse[]> {
    return this.collectionsService.listFollowers(params.id, identity);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createCollection(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: CollectionCreateDto,
  ): Promise<CollectionResponse> {
    return this.collectionsService.createCollection(playerIdOf(identity), body);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async followCollection(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
  ): Promise<void> {
    await this.collectionsService.followCollection(playerIdOf(identity), params.id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unfollowCollection(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
  ): Promise<void> {
    await this.collectionsService.unfollowCollection(playerIdOf(identity), params.id);
  }

  @Post(':id/clone')
  @UseGuards(JwtAuthGuard)
  cloneCollection(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
  ): Promise<CollectionResponse> {
    return this.collectionsService.cloneCollection(playerIdOf(identity), params.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateCollection(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
    @Body() body: CollectionPatchDto,
  ): Promise<CollectionResponse> {
    return this.collectionsService.updateCollection(params.id, playerIdOf(identity), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteCollection(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: CollectionIdParamDto,
  ): Promise<void> {
    await this.collectionsService.deleteCollection(params.id, playerIdOf(identity));
  }
}
