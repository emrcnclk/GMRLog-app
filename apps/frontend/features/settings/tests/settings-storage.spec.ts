import { describe, expect, it } from 'vitest';

import {
  buildStorageInfo,
  clearCacheLabel,
  formatImageCacheLabel,
  formatQueryCacheLabel,
  formatSecureStoreLabel,
} from '../model/storage-model';

describe('settings storage model', () => {
  it('labels clear actions', () => {
    expect(clearCacheLabel('image')).toBe('Clear image cache');
    expect(clearCacheLabel('query')).toBe('Clear query cache');
    expect(clearCacheLabel('app')).toBe('Clear app cache');
  });

  it('formats query cache count', () => {
    expect(formatQueryCacheLabel(0)).toContain('0');
    expect(formatQueryCacheLabel(12)).toContain('12');
  });

  it('describes image cache honestly', () => {
    expect(formatImageCacheLabel()).toContain('expo-image');
    expect(formatImageCacheLabel(true)).toContain('expo-image');
  });

  it('protects SecureStore copy', () => {
    expect(formatSecureStoreLabel()).toContain('not cleared');
  });

  it('builds storage snapshot', () => {
    const info = buildStorageInfo(3);
    expect(info.queryEntryCount).toBe(3);
    expect(info.queryCacheLabel).toContain('3');
    expect(info.secureStoreLabel).toContain('SecureStore');
  });
});
