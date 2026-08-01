import { describe, expect, it } from 'vitest';

import { createLogger, getLogger, setLogger } from './logger';

describe('logger abstraction', () => {
  it('creates a console logger for development', () => {
    const logger = createLogger('development');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('creates a silent logger for production and staging', () => {
    const production = createLogger('production');
    const staging = createLogger('staging');
    expect(() => production.info('secret')).not.toThrow();
    expect(() => staging.warn('secret')).not.toThrow();
  });

  it('allows injecting an active logger', () => {
    const calls: string[] = [];
    setLogger({
      debug: () => undefined,
      info: (message) => {
        calls.push(message);
      },
      warn: () => undefined,
      error: () => undefined,
    });
    getLogger().info('hello');
    expect(calls).toEqual(['hello']);
  });
});
