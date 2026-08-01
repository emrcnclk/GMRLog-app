import { PrismaMuteRepository, PrismaUserRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { MutesController } from './mutes.controller';
import { MutesService } from './mutes.service';
import { MUTE_REPOSITORY, MUTE_USER_REPOSITORY } from './mutes.tokens';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MutesController],
  providers: [
    {
      provide: MUTE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaMuteRepository(prisma),
    },
    {
      provide: MUTE_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    MutesService,
  ],
  exports: [MUTE_REPOSITORY, MutesService],
})
export class MutesModule {}
