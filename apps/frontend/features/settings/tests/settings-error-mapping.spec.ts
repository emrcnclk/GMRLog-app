import { describe, expect, it, vi } from 'vitest';

import { mapSettingsError } from '../model/settings-model';

describe('settings error mapping', () => {
  it('maps offline first', () => {
    expect(mapSettingsError(new Error('network'), false).kind).toBe('offline');
  });

  it('maps unknown online errors', () => {
    const mapped = mapSettingsError(new Error('unexpected'), true);
    expect(mapped.title.length).toBeGreaterThan(0);
    expect(mapped.description.length).toBeGreaterThan(0);
  });

  it('never throws while mapping', () => {
    expect(() => mapSettingsError(null, true)).not.toThrow();
    expect(() => mapSettingsError(undefined, false)).not.toThrow();
    expect(() => mapSettingsError('string', true)).not.toThrow();
  });

  it('keeps ErrorBanner contract fields', () => {
    const mapped = mapSettingsError(vi.fn(), true);
    expect(mapped).toHaveProperty('title');
    expect(mapped).toHaveProperty('description');
    expect(mapped).toHaveProperty('kind');
  });
});
