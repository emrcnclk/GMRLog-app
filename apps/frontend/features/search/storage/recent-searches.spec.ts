import { describe, expect, it } from 'vitest';

import { createInMemorySecureStorage } from '../../../lib/storage/secure-storage';

import {
  loadRecentSearches,
  RECENT_SEARCHES_MAX,
  removeRecentSearch,
  saveRecentSearches,
  upsertRecentSearch,
} from '../storage/recent-searches';

describe('recent searches', () => {
  it('moves duplicates to top and caps at 10', () => {
    let list: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      list = upsertRecentSearch(list, `q${String(i)}`);
    }
    expect(list).toHaveLength(RECENT_SEARCHES_MAX);
    expect(list[0]).toBe('q11');

    list = upsertRecentSearch(list, 'q5');
    expect(list[0]).toBe('q5');
    expect(list.filter((item) => item === 'q5')).toHaveLength(1);
  });

  it('removes entries', () => {
    expect(removeRecentSearch(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('persists via SecureStorage', async () => {
    const storage = createInMemorySecureStorage();
    await saveRecentSearches(storage, ['alpha', 'beta']);
    await expect(loadRecentSearches(storage)).resolves.toEqual(['alpha', 'beta']);
  });

  it('ignores empty / whitespace upserts', () => {
    expect(upsertRecentSearch(['keep'], '   ')).toEqual(['keep']);
  });
});
