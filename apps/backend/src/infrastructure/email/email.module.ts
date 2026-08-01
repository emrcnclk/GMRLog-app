import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/config.module';
import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';

import { EMAIL_PORT } from './email.port';
import { NoopEmailService } from './noop-email.service';
import { SmtpEmailService } from './smtp-email.service';

@Module({
  imports: [AppConfigModule],
  providers: [
    SmtpEmailService,
    NoopEmailService,
    {
      provide: EMAIL_PORT,
      inject: [ENV, SmtpEmailService, NoopEmailService],
      useFactory: (env: BackendEnv, smtp: SmtpEmailService, noop: NoopEmailService) =>
        env.NODE_ENV === 'test' ? noop : smtp,
    },
  ],
  exports: [EMAIL_PORT, NoopEmailService],
})
export class EmailModule {}
