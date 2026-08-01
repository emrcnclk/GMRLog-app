import type { SearchHit } from '@gmrlog/types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalGuestGuard } from '../auth/guards/optional-guest.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import type { PaginatedPayload } from '../infrastructure/http/paginated-payload';

import { SearchQueryDto } from './dto/search.dto';
import { SearchService } from './search.service';

/**
 * S1 §13.5 — Search resource. Transport only.
 * Recommendations · feed · discover are separate S1 resources.
 */
@ApiTags('search')
@ApiBearerAuth('bearer')
@Controller('search')
@UseGuards(OptionalGuestGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @CurrentUser() identity: RequestIdentity,
    @Query() query: SearchQueryDto,
  ): Promise<PaginatedPayload<SearchHit>> {
    return this.searchService.search(identity, query);
  }
}
