import { describe, expect, it, vi } from 'vitest';

import { parseBackendEnv } from '../config/env.schema';

import { AppLogger } from './app-logger.service';

describe('AppLogger', () => {
  it('logs through pino helpers', () => {
    const logger = new AppLogger(parseBackendEnv({ LOG_LEVEL: 'silent' }));
    expect(() => {
      logger.log('hello', 'TestContext');
      logger.warn('warn', 'TestContext');
      logger.error('error', 'stack', 'TestContext');
      logger.debug('debug', 'TestContext');
      logger.verbose('verbose', 'TestContext');
      logger.fatal('fatal', 'TestContext');
      logger.event('info', { requestId: 'req-1' }, 'request completed');
    }).not.toThrow();
  });

  it('uses file transport when LOG_FILE is configured', () => {
    const logger = new AppLogger(
      parseBackendEnv({ LOG_FILE: 'logs/test.log', LOG_LEVEL: 'silent' }),
    );
    expect(() => logger.log(new Error('boom'))).not.toThrow();
    expect(logger).toBeDefined();
  });

  it('redacts credential-shaped fields from the actual emitted line', () => {
    const chunks: string[] = [];
    const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      chunks.push(String(chunk));
      return true;
    });

    try {
      const logger = new AppLogger(parseBackendEnv({ LOG_LEVEL: 'info' }));
      logger.event(
        'info',
        {
          password: 'hunter2',
          accessToken: 'live-token-value',
          headers: { authorization: 'Bearer live-token-value', cookie: 'session=abc' },
          requestId: 'req-1',
        },
        'request completed',
      );
    } finally {
      write.mockRestore();
    }

    const line = chunks.join('');
    expect(line).not.toContain('hunter2');
    expect(line).not.toContain('live-token-value');
    expect(line).not.toContain('session=abc');
    expect(line).toContain('[REDACTED]');
    // Fields not on the redaction list still come through — this is a floor,
    // not a general PII scrubber.
    expect(line).toContain('req-1');
  });
});
