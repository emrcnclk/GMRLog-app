import * as Sentry from '@sentry/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../config/env.schema';

import { AppLogger } from './app-logger.service';
import { installProcessGuards, setProcessGuardLogger } from './process-guards';

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));

describe('process guards', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
    vi.mocked(Sentry.flush).mockClear();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    installProcessGuards();
  });

  afterEach(() => {
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
    exitSpy.mockRestore();
  });

  it('falls back to console when no logger has been set yet', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    (process.emit as (event: string, ...args: unknown[]) => boolean)(
      'uncaughtException',
      new Error('boot-time failure'),
      'uncaughtException',
    );

    expect(consoleSpy).toHaveBeenCalledWith('[uncaughtException]', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('captures a real unhandledRejection with its stack, and does not exit the process', async () => {
    const chunks: string[] = [];
    const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    });
    setProcessGuardLogger(new AppLogger(parseBackendEnv({ LOG_LEVEL: 'info' })));

    const rejectionSeen = new Promise<void>((resolve) => {
      process.once('unhandledRejection', () => {
        // Let the guard's own listener (registered first) run before we assert.
        queueMicrotask(resolve);
      });
    });
    void Promise.reject(new Error('boom from a voided call'));
    await rejectionSeen;
    write.mockRestore();

    const line = chunks.join('');
    expect(line).toContain('unhandledRejection');
    expect(line).toContain('boom from a voided call');
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom from a voided call' }),
      expect.objectContaining({ tags: { source: 'unhandledRejection' } }),
    );
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('captures a real uncaughtException and exits after flushing Sentry', async () => {
    setProcessGuardLogger(new AppLogger(parseBackendEnv({ LOG_LEVEL: 'silent' })));

    const flushed = new Promise<void>((resolve) => {
      vi.mocked(Sentry.flush).mockImplementationOnce(async () => {
        resolve();
        return true;
      });
    });
    (process.emit as (event: string, ...args: unknown[]) => boolean)(
      'uncaughtException',
      new Error('process is now in an undefined state'),
      'uncaughtException',
    );
    await flushed;
    await Promise.resolve();

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'process is now in an undefined state' }),
      expect.objectContaining({ tags: { source: 'uncaughtException' } }),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
