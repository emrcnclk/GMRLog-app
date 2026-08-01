import type {
  GameMediaResponse,
  GameMetadataStatusResponse,
  GameRelatedGameResponse,
  GameResponse,
} from '@gmrlog/types';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';

import { GameIdParamDto } from './dto/game.dto';
import { GamesService } from './games.service';

/**
 * S1 §13.6 — Games catalog detail. Game Hub routes live in GameHubModule.
 * D3.25 adds catalog metadata reads; none of them block on a provider.
 */
@ApiTags('games')
@ApiBearerAuth('bearer')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get(':id')
  @UseGuards(OptionalGuestGuard)
  getGame(
    @Param() params: GameIdParamDto,
    @CurrentUser() identity: RequestIdentity,
  ): Promise<GameResponse> {
    return this.gamesService.getGame(params.id, identity);
  }

  @Get(':id/media')
  @UseGuards(OptionalGuestGuard)
  @ApiOperation({
    summary: 'Mirrored catalog artwork for a game (D3.25)',
    description: 'Serves persisted media only. Never waits on a metadata provider.',
  })
  listMedia(@Param() params: GameIdParamDto): Promise<GameMediaResponse[]> {
    return this.gamesService.listMedia(params.id);
  }

  @Get(':id/similar')
  @UseGuards(OptionalGuestGuard)
  @ApiOperation({
    summary: 'Provider-declared similar games (D3.25)',
    description:
      'Entries not yet present in the catalog return `gameId: null` with the provider title.',
  })
  listSimilar(@Param() params: GameIdParamDto): Promise<GameRelatedGameResponse[]> {
    return this.gamesService.listSimilar(params.id);
  }

  @Get(':id/metadata')
  @UseGuards(OptionalGuestGuard)
  @ApiOperation({
    summary: 'Catalog enrichment status and attribution (D3.25)',
    description: 'Read-only. Does not trigger enrichment.',
  })
  getMetadataStatus(@Param() params: GameIdParamDto): Promise<GameMetadataStatusResponse> {
    return this.gamesService.getMetadataStatus(params.id);
  }
}
