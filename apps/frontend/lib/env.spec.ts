import { describe, expect, it } from 'vitest';

import { loadFrontendEnv } from './env';

describe('loadFrontendEnv', () => {
  it('applies documented defaults', () => {
    const env = loadFrontendEnv({});
    expect(env.APP_ENV).toBe('development');
    expect(env.EXPO_PUBLIC_API_URL).toBe('http://localhost:4000/api/v1');
    expect(env.EXPO_PUBLIC_SOCKET_URL).toBe('http://localhost:4000');
  });

  it('accepts staging and production', () => {
    expect(loadFrontendEnv({ APP_ENV: 'staging' }).APP_ENV).toBe('staging');
    expect(loadFrontendEnv({ APP_ENV: 'production' }).APP_ENV).toBe('production');
  });

  it('rejects invalid API URLs', () => {
    expect(() => loadFrontendEnv({ EXPO_PUBLIC_API_URL: 'not-a-url' })).toThrow(
      /EXPO_PUBLIC_API_URL/,
    );
  });
});
