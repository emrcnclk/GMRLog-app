import {
  PrismaConversationParticipantRepository,
  PrismaConversationRepository,
  PrismaMessageRepository,
  PrismaUserRepository,
} from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import {
  CONVERSATION_PARTICIPANT_REPOSITORY,
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  MESSAGING_USER_REPOSITORY,
} from './messaging.tokens';

/**
 * Messaging domain (D2.13). Controllers → MessagingService →
 * `@gmrlog/database` repositories (F6.3).
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MessagingController],
  providers: [
    {
      provide: CONVERSATION_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaConversationRepository(prisma),
    },
    {
      provide: CONVERSATION_PARTICIPANT_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaConversationParticipantRepository(prisma),
    },
    {
      provide: MESSAGE_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaMessageRepository(prisma),
    },
    {
      provide: MESSAGING_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    MessagingService,
  ],
  exports: [CONVERSATION_REPOSITORY, CONVERSATION_PARTICIPANT_REPOSITORY, MESSAGE_REPOSITORY],
})
export class MessagingModule {}
