import { Global, Module } from '@nestjs/common';

import { parseBackendEnv } from './env.schema';

/** Injection token for the validated backend environment (`BackendEnv`). */
export const ENV = Symbol('GMRLOG_BACKEND_ENV');

@Global()
@Module({
  providers: [
    {
      provide: ENV,
      useFactory: () => parseBackendEnv(process.env),
    },
  ],
  exports: [ENV],
})
export class AppConfigModule {}
