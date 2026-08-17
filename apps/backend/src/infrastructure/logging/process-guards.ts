import * as Sentry from '@sentry/node';

import type { AppLogger } from './app-logger.service';

/**
 * Process-level guard against the 10.1 failure shape: an unhandled rejection
 * or exception that would otherwise vanish (Node prints to stderr and, for
 * uncaughtException, may or may not exit depending on version/flags) with no
 * durable record and nothing to correlate it to.
 *
 * Registered as early as possible in `main.ts`, before `AppLogger` exists —
 * `setProcessGuardLogger` lets bootstrap hand the real logger in once it's
 * built, so failures during the rest of bootstrap still get a console
 * fallback instead of vanishing silently.
 *
 * uncaughtException specifically exits after reporting: Node's own guidance
 * is that the process is in an undefined state past that point and must not
 * resume normal operation. unhandledRejection does not exit — Node's default
 * for it is a warning, not a crash, and every rejection already observed in
 * this codebase (10.1) was a missed `await`, not a corrupted process state.
 */

let processGuardLogger: AppLogger | undefined;

export function setProcessGuardLogger(logger: AppLogger): void {
  processGuardLogger = logger;
}

export function recordProcessFailure(source: string, reason: unknown): Error {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  if (processGuardLogger) {
    processGuardLogger.event(
      'error',
      { source, stack: error.stack },
      `${source}: ${error.message}`,
    );
  } else {
    console.error(`[${source}]`, error);
  }
  return error;
}

export function installProcessGuards(): void {
  process.on('unhandledRejection', (reason) => {
    const error = recordProcessFailure('unhandledRejection', reason);
    Sentry.captureException(error, { tags: { source: 'unhandledRejection' } });
  });

  process.on('uncaughtException', (reason) => {
    const error = recordProcessFailure('uncaughtException', reason);
    Sentry.captureException(error, { tags: { source: 'uncaughtException' } });
    void Sentry.flush(2000).finally(() => {
      process.exit(1);
    });
  });
}
