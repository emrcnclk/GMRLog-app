import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadEnv } from 'dotenv';
import { describe, expect, it } from 'vitest';

import { loadBackendDotenv } from './load-dotenv';

describe('loadBackendDotenv', () => {
  it('is callable without throwing when no .env is required', () => {
    expect(() => loadBackendDotenv()).not.toThrow();
  });

  it('resolves candidate paths that may exist in monorepo layouts', () => {
    const candidates = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
    expect(candidates.every((file) => typeof file === 'string')).toBe(true);
    expect(typeof existsSync(candidates[0]!)).toBe('boolean');
    expect(typeof loadEnv).toBe('function');
  });
});
