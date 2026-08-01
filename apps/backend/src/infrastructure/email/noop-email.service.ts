import { Injectable } from '@nestjs/common';

import type { EmailMessage, EmailPort } from './email.port';

/** No-op email service for tests and environments without SMTP. */
@Injectable()
export class NoopEmailService implements EmailPort {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}
