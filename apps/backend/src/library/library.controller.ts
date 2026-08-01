import type { LibraryEntryResponse, LibraryHubResponse } from '@gmrlog/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';

import {
  LibraryEntriesQueryDto,
  LibraryEntryGameIdParamDto,
  LibraryEntryUpsertDto,
  WishlistMetadataPatchDto,
} from './dto/library.dto';
import { LibraryService } from './library.service';

/**
 * S1 §13.9 / D3.22 — Library surfaces ("P"). Transport only — no business logic.
 * Import-job endpoints are intentionally omitted (D2.3 forbidden scope).
 */
@ApiTags('library')
@ApiBearerAuth('bearer')
@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get()
  getHub(@CurrentUser() identity: RequestIdentity): Promise<LibraryHubResponse> {
    return this.libraryService.getHub(playerIdOf(identity));
  }

  @Get('entries')
  listEntries(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: LibraryEntriesQueryDto,
  ): Promise<LibraryEntryResponse[]> {
    return this.libraryService.listEntries(playerIdOf(identity), query);
  }

  @Get('entries/:gameId')
  getEntry(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: LibraryEntryGameIdParamDto,
  ): Promise<LibraryEntryResponse> {
    return this.libraryService.getEntry(playerIdOf(identity), params.gameId);
  }

  @Put('entries/:gameId')
  upsertEntry(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: LibraryEntryGameIdParamDto,
    @Body() body: LibraryEntryUpsertDto,
  ): Promise<LibraryEntryResponse> {
    return this.libraryService.upsertEntry(playerIdOf(identity), params.gameId, body);
  }

  @Patch('entries/:gameId/wishlist-meta')
  upsertWishlistMetadata(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: LibraryEntryGameIdParamDto,
    @Body() body: WishlistMetadataPatchDto,
  ): Promise<LibraryEntryResponse> {
    return this.libraryService.upsertWishlistMetadata(playerIdOf(identity), params.gameId, body);
  }

  @Delete('entries/:gameId')
  @HttpCode(204)
  async deleteEntry(
    @CurrentUser() identity: RequestIdentity,
    @Param() params: LibraryEntryGameIdParamDto,
  ): Promise<void> {
    await this.libraryService.deleteEntry(playerIdOf(identity), params.gameId);
  }
}
