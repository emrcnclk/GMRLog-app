import { describe, expect, it } from 'vitest';

import { parseBackendEnv } from './env.schema';

describe('parseBackendEnv', () => {
  it('applies documented defaults', () => {
    const env = parseBackendEnv({});
    expect(env.API_PORT).toBe(4000);
    expect(env.API_GLOBAL_PREFIX).toBe('api/v1');
    expect(env.APP_ENV).toBe('development');
    expect(env.API_DOCS_ENABLED).toBe(true);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3000']);
    expect(env.MEDIA_PUBLIC_BASE_URL).toBe('http://localhost:9000/gmrlog/');
    expect(env.S3_BUCKET).toBe('gmrlog');
    expect(env.S3_ENDPOINT).toBe('http://localhost:9000');
  });

  it('parses CORS_ORIGINS as a trimmed list', () => {
    const env = parseBackendEnv({ CORS_ORIGINS: 'http://a.test, http://b.test' });
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('rejects invalid values with a readable error', () => {
    expect(() => parseBackendEnv({ API_PORT: 'not-a-port' })).toThrow(/API_PORT/);
  });

  it('rejects the dev-only JWT secret in production (fail-closed)', () => {
    expect(() => parseBackendEnv({ NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET|missing required/,
    );
  });

  it('rejects production boot when required keys are missing', () => {
    expect(() =>
      parseBackendEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a'.repeat(48),
        DATABASE_URL: 'postgresql://gmrlog:gmrlog@localhost:5432/gmrlog?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        S3_BUCKET: 'gmrlog',
        S3_ENDPOINT: 'http://localhost:9000',
        SMTP_HOST: 'mailpit',
      }),
    ).toThrow(/MEILI_HOST/);
  });

  it('rejects production when an explicit required key is absent from source', () => {
    expect(() =>
      parseBackendEnv({
        NODE_ENV: 'production',
        APP_ENV: 'production',
        JWT_SECRET: 'a'.repeat(48),
        REDIS_URL: 'redis://localhost:6379',
        S3_BUCKET: 'gmrlog',
        S3_ENDPOINT: 'http://localhost:9000',
        SMTP_HOST: 'mailpit',
        MEILI_HOST: 'http://localhost:7700',
      }),
    ).toThrow(/DATABASE_URL/);
  });

  // Bug 3. A missing Steam key used to be silently survivable: the client
  // factory fell back to `MockSteamWebApiClient` and the box came up serving
  // fixture libraries as real player data. Production boot must refuse instead.
  it('rejects production when STEAM_WEB_API_KEY is absent', () => {
    expect(() =>
      parseBackendEnv({
        NODE_ENV: 'production',
        APP_ENV: 'production',
        JWT_SECRET: 'a'.repeat(48),
        DATABASE_URL: 'postgresql://gmrlog:gmrlog@localhost:5432/gmrlog?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        S3_BUCKET: 'gmrlog',
        S3_ENDPOINT: 'http://localhost:9000',
        SMTP_HOST: 'mailpit',
        MEILI_HOST: 'http://localhost:7700',
      }),
    ).toThrow(/STEAM_WEB_API_KEY/);
  });

  it('accepts production when all required keys are explicit', () => {
    expect(() =>
      parseBackendEnv({
        NODE_ENV: 'production',
        APP_ENV: 'production',
        JWT_SECRET: 'a'.repeat(48),
        DATABASE_URL: 'postgresql://gmrlog:gmrlog@localhost:5432/gmrlog?schema=public',
        REDIS_URL: 'redis://localhost:6379',
        S3_BUCKET: 'gmrlog',
        S3_ENDPOINT: 'http://localhost:9000',
        SMTP_HOST: 'mailpit',
        MEILI_HOST: 'http://localhost:7700',
        STEAM_WEB_API_KEY: 'a-real-steam-key',
      }),
    ).not.toThrow();
  });
});
