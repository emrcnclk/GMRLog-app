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
});
