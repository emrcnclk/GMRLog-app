import { PrismaUploadRepository, PrismaUserRepository } from '@gmrlog/database';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { JobsModule } from '../infrastructure/jobs/jobs.module';
import { StorageModule } from '../infrastructure/storage/storage.module';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { UPLOAD_REPOSITORY, UPLOAD_USER_REPOSITORY } from './uploads.tokens';

/**
 * Uploads domain (D3.19). Controllers → UploadsService → storage + repositories.
 */
@Module({
  imports: [AuthModule, PrismaModule, StorageModule, JobsModule],
  controllers: [UploadsController],
  providers: [
    {
      provide: UPLOAD_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUploadRepository(prisma),
    },
    {
      provide: UPLOAD_USER_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
    },
    UploadsService,
  ],
  exports: [UPLOAD_REPOSITORY, UploadsService],
})
export class UploadsModule {}
