import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';

import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionModule } from './account-deletion.module';
import { DataExportController } from './data-export.controller';
import { DataExportService } from './data-export.service';
import { LegalConsentController } from './legal-consent.controller';
import { LegalConsentModule } from './legal-consent.module';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

/**
 * 12.2 / 12.4 / 12.5 / 12.6 — public legal documents, a player's own consent
 * record, and a player's own data export and account deletion.
 *
 * `LegalService` and the public `/legal` routes depend on nothing: the texts are
 * compiled in (12.1), so a legal document stays readable when the database,
 * Redis and the object store are not. The consent and deletion controllers
 * necessarily need more — both are the player's own record and both require
 * knowing who you are — which is why each is its own controller rather than
 * more routes on the first. `DataExportService` and `AccountDeletionService`
 * both read/write across tables `LegalConsentModule`'s repository interface
 * doesn't cover, so both go through `PrismaModule` directly instead.
 */
@Module({
  imports: [AuthModule, LegalConsentModule, AccountDeletionModule, PrismaModule],
  controllers: [
    LegalController,
    LegalConsentController,
    DataExportController,
    AccountDeletionController,
  ],
  providers: [LegalService, DataExportService],
  exports: [LegalService],
})
export class LegalModule {}
