import { PrismaClient } from '@gmrlog/database';
import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';

/**
 * Prisma bootstrap. Connection is lazy (established on first query — D2+);
 * the platform boots honestly without a database. Repositories consume this
 * service; controllers never do (F6.3 §9/§11).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnApplicationShutdown {
  constructor(@Inject(ENV) env: BackendEnv) {
    super({ datasourceUrl: env.DATABASE_URL });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
