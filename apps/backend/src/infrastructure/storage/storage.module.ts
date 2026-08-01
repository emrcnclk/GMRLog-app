import { Module } from '@nestjs/common';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';
import { RedisModule } from '../redis/redis.module';

import { S3ObjectStorage } from './s3-object-storage';
import { OBJECT_STORAGE, UPLOAD_GRANT_META } from './storage.tokens';
import { UploadGrantMetaStore } from './upload-grant-meta.store';

@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [ENV],
      useFactory: (env: BackendEnv) => new S3ObjectStorage(env),
    },
    {
      provide: UPLOAD_GRANT_META,
      useClass: UploadGrantMetaStore,
    },
  ],
  exports: [OBJECT_STORAGE, UPLOAD_GRANT_META],
})
export class StorageModule {}
