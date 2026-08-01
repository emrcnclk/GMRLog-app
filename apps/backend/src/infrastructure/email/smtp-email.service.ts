import { Inject, Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';

import type { EmailMessage, EmailPort } from './email.port';

@Injectable()
export class SmtpEmailService implements EmailPort {
  private readonly transporter: Transporter;

  constructor(@Inject(ENV) private readonly env: BackendEnv) {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      ...(env.SMTP_USERNAME.length > 0
        ? { auth: { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD } }
        : {}),
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html !== undefined ? { html: message.html } : {}),
    });
  }
}
