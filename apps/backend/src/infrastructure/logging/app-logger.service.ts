import { Inject, Injectable, type LoggerService } from '@nestjs/common';
import pino, { stdTimeFunctions, type Logger as PinoLogger } from 'pino';

import { ENV } from '../config/config.module';
import type { BackendEnv } from '../config/env.schema';

function toMessage(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof Error) return input.message;
  return JSON.stringify(input);
}

/**
 * Structured logger abstraction (pino). The only sanctioned logging surface —
 * domains never construct their own transports.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: PinoLogger;

  constructor(@Inject(ENV) env: BackendEnv) {
    const options = {
      level: env.LOG_LEVEL,
      base: { service: 'gmrlog-backend', environment: env.APP_ENV },
      timestamp: stdTimeFunctions.isoTime,
      // Floor against a call site accidentally passing a credential into an
      // event binding — not a substitute for not logging these in the first
      // place. Paths are one level deep by design: pino's redact does not
      // recurse into unknown depths, so this only catches the field names it
      // lists, wherever they appear as a direct property of the log object.
      redact: {
        paths: [
          'password',
          'newPassword',
          'token',
          'accessToken',
          'refreshToken',
          'idToken',
          'authorization',
          'secret',
          'apiKey',
          'headers.authorization',
          'headers.cookie',
        ],
        censor: '[REDACTED]',
      },
    };

    const logFile = env.LOG_FILE.trim();
    if (logFile.length > 0) {
      const transport = pino.transport({
        target: 'pino-roll',
        options: {
          file: logFile,
          frequency: 'daily',
          mkdir: true,
        },
      });
      this.logger = pino(options, transport);
      return;
    }

    this.logger = pino(options);
  }

  /** Structured event logging for infrastructure (request logs etc.). */
  event(level: 'info' | 'warn' | 'error' | 'debug', bindings: object, message: string): void {
    this.logger[level](bindings, message);
  }

  log(message: unknown, context?: string): void {
    this.logger.info({ context }, toMessage(message));
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.logger.error({ context, stack }, toMessage(message));
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context }, toMessage(message));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context }, toMessage(message));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context }, toMessage(message));
  }

  fatal(message: unknown, context?: string): void {
    this.logger.fatal({ context }, toMessage(message));
  }
}
