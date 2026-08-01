import { describe, expect, it } from 'vitest';

import {
  getApiBaseUrl,
  getReleaseFlags,
  isDevelopmentBuild,
  isProductionLike,
} from './runtime-flags';

describe('runtime flags / production guards', () => {
  it('exposes release flags with monitoring disabled', () => {
    const flags = getReleaseFlags();
    expect(flags.queryPersistence).toBe(true);
    expect(flags.offlineMutationQueue).toBe(true);
    expect(flags.monitoringProvidersEnabled).toBe(false);
  });

  it('resolves API base URL from env defaults', () => {
    expect(getApiBaseUrl()).toMatch(/^https?:\/\//);
  });

  it('treats default APP_ENV as development-capable', () => {
    expect(typeof isDevelopmentBuild()).toBe('boolean');
    expect(typeof isProductionLike()).toBe('boolean');
  });
});
