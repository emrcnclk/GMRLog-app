import { Module } from '@nestjs/common';

import { PrismaModule } from '../infrastructure/database/prisma.module';

import { AccountDeletionService } from './account-deletion.service';

/**
 * 12.6 — the deletion service, with no controller and no auth dependency.
 *
 * Same split `LegalConsentModule` uses and for the same reason: `AuthModule`
 * needs this service for the login-time grace-period check, and the
 * deletion *controller* needs `AuthModule` for its JWT guard. Putting both in
 * one module would close that loop and require a `forwardRef`. The graph
 * stays a line: `LegalModule` → `AuthModule` → `AccountDeletionModule` →
 * `PrismaModule`.
 */
@Module({
  imports: [PrismaModule],
  providers: [AccountDeletionService],
  exports: [AccountDeletionService],
})
export class AccountDeletionModule {}
