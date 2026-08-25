import type { LegalDocumentResponse, LegalDocumentSummaryResponse } from '@gmrlog/types';
import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LegalDocumentParamDto, LegalLocaleQueryDto } from './dto/legal.dto';
import { LegalService } from './legal.service';

/**
 * 12.2 — public legal documents. Terms of Service, Privacy Policy and the KVKK
 * Aydınlatma Metni.
 *
 * **No guard, deliberately, and this is the point of the route.** Every other
 * read surface in the app takes at least `OptionalGuestGuard`. A visitor
 * standing on the sign-in screen has no account and no token, and they must be
 * able to read what they are about to agree to before they create one —
 * gating the terms behind the account the terms govern is circular.
 *
 * **No `@RateLimitClass` either.** Rate limiting here is opt-in per route and
 * is fail-closed on Redis (`503 INTEGRATION_UNAVAILABLE` when it is not
 * ready). These handlers touch no I/O at all, so leaving the decorator off
 * keeps a legal document readable when the rest of the stack is not — which
 * CLAUDE.md's environment notes say is a real state, not a hypothetical.
 */
@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  // Five minutes: long enough that the sign-up and About screens are not
  // re-fetching three documents per visit, short enough that a version bump
  // reaches a reader — and 12.4 raises re-consent — within one sitting rather
  // than one day. A legal document that keeps serving a superseded version
  // from a cache is the failure worth designing against here.
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Current version of every legal document',
    description:
      'Metadata only, no bodies — so a client can detect a version bump without fetching every text.',
  })
  @ApiOkResponse({ description: 'Enveloped list of document summaries' })
  listDocuments(@Query() query: LegalLocaleQueryDto): LegalDocumentSummaryResponse[] {
    return this.legalService.listDocuments(query.locale);
  }

  @Get(':document')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({
    summary: 'One legal document, body included',
    description:
      'Body is Markdown. An unpublished locale falls back to the default rather than 404ing.',
  })
  @ApiOkResponse({ description: 'Enveloped legal document' })
  getDocument(
    @Param() params: LegalDocumentParamDto,
    @Query() query: LegalLocaleQueryDto,
  ): LegalDocumentResponse {
    return this.legalService.getDocument(params.document, query.locale);
  }
}
