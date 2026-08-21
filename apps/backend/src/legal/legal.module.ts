import { Module } from '@nestjs/common';

import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

/**
 * 12.2 — public legal documents. Imports nothing: the texts are compiled in
 * (12.1), so this module has no database, cache or storage dependency and
 * cannot be taken down by one.
 */
@Module({
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
