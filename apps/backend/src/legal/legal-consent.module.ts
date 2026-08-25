import { PrismaUserConsentRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { LegalConsentService } from './legal-consent.service';
import { LEGAL_CONSENT_REPOSITORY } from './legal.tokens';

/**
 * 12.4 — the consent service, with no controller and no auth dependency.
 *
 * Split out from `LegalModule` to keep the module graph acyclic. `AuthModule`
 * needs this service for the register flow, and the consent *controller* needs
 * `AuthModule` for its JWT guard; putting service and controller in one module
 * would close that loop and require a `forwardRef`. Here the graph is a line:
 * `LegalModule` → `AuthModule` → `LegalConsentModule` → `PrismaModule`.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    LegalConsentService,
    {
      provide: LEGAL_CONSENT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserConsentRepository(prisma),
    },
  ],
  exports: [LegalConsentService],
})
export class LegalConsentModule {}
