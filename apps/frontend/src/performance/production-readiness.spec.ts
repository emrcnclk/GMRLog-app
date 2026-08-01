import { describe, expect, it } from 'vitest';

import { BUNDLE_SPLIT_CANDIDATES, DEAD_CODE_GUARDS } from '../performance/bundle-policy';
import {
  EPHEMERAL_QUERY_ROOTS,
  IMAGE_MEMORY_POLICY,
  INFINITE_QUERY_PAGE_SOFT_CAP,
} from '../performance/memory-policy';

describe('bundle and memory policies', () => {
  it('lists route-split candidates', () => {
    expect(BUNDLE_SPLIT_CANDIDATES.length).toBeGreaterThan(0);
    expect(DEAD_CODE_GUARDS).toContain('No Alert() usage');
  });

  it('keeps ephemeral query roots and image cache policy', () => {
    expect(EPHEMERAL_QUERY_ROOTS).toContain('search');
    expect(IMAGE_MEMORY_POLICY.cachePolicy).toBe('memory-disk');
    expect(INFINITE_QUERY_PAGE_SOFT_CAP).toBe(3);
  });
});
