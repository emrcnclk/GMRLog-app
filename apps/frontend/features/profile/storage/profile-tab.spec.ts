import { describe, expect, it } from 'vitest';

import { createInMemorySecureStorage } from '../../../lib/storage/secure-storage';
import {
  loadProfileTab,
  PROFILE_TAB_DEFAULT,
  PROFILE_TAB_STORAGE_KEY,
  saveProfileTab,
} from './profile-tab';

describe('profile tab persistence', () => {
  it('defaults to overview', async () => {
    const storage = createInMemorySecureStorage();
    await expect(loadProfileTab(storage)).resolves.toBe(PROFILE_TAB_DEFAULT);
  });

  it('remembers last selected tab', async () => {
    const storage = createInMemorySecureStorage();
    await saveProfileTab(storage, 'library');
    await expect(storage.getItem(PROFILE_TAB_STORAGE_KEY)).resolves.toBe('library');
    await expect(loadProfileTab(storage)).resolves.toBe('library');
  });

  it('falls back on invalid stored value', async () => {
    const storage = createInMemorySecureStorage();
    await storage.setItem(PROFILE_TAB_STORAGE_KEY, 'not-a-tab');
    await expect(loadProfileTab(storage)).resolves.toBe('overview');
  });
});
