import type { QuoteResponse } from '@gmrlog/types';
import { quoteCreateSchema } from '@gmrlog/validators';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestIdentity } from '../auth/interfaces/identity';
import { playerIdOf } from '../auth/player-id';
import { Idempotent } from '../infrastructure/http/idempotency.interceptor';
import { ApiZodBody } from '../infrastructure/openapi/swagger.decorators';

import { QuoteCreateDto } from './dto/quote.dto';
import { QuotesService } from './quotes.service';

@ApiTags('quotes')
@ApiBearerAuth('bearer')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Idempotent()
  @ApiZodBody(quoteCreateSchema)
  create(
    @CurrentUser() identity: RequestIdentity,
    @Body() body: QuoteCreateDto,
  ): Promise<QuoteResponse> {
    return this.quotesService.createQuote(playerIdOf(identity), body);
  }
}
