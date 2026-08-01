import { PrismaBlockRepository, PrismaUserRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { BLOCK_REPOSITORY, BLOCK_USER_REPOSITORY } from './blocks.tokens';

/**
 * Blocks domain (S1 §13.13). Controllers → BlocksService → `@gmrlog/database`
 * repositories (F6.3). No follow cascade · feed filtering · notifications.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BlocksController],
  providers: [
    {
      provide: BLOCK_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaBlockRepository(prisma),
    },
    {
      provide: BLOCK_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    BlocksService,
  ],
  exports: [BLOCK_REPOSITORY],
})
export class BlocksModule {}
