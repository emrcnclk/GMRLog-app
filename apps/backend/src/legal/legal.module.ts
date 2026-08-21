import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { LegalConsentController } from './legal-consent.controller';
import { LegalConsentModule } from './legal-consent.module';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

/**
 * 12.2 / 12.4 — public legal documents, and a player's own consent record.
 *
 * `LegalService` and the public `/legal` routes depend on nothing: the texts are
 * compiled in (12.1), so a legal document stays readable when the database,
 * Redis and the object store are not. The consent controller necessarily needs
 * more — a consent record is evidence and has to be persisted, and reading your
 * own record requires knowing who you are — which is why it is a second
 * controller rather than more routes on the first.
 */
@Module({
  imports: [AuthModule, LegalConsentModule],
  controllers: [LegalController, LegalConsentController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
