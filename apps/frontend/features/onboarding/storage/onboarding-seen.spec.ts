import { describe, expect, it } from 'vitest';

import { createInMemorySecureStorage } from '../../../lib/storage/secure-storage';
import {
  loadOnboardingSeen,
  ONBOARDING_SEEN_STORAGE_KEY,
  saveOnboardingSeen,
} from './onboarding-seen';

describe('onboarding seen persistence', () => {
  it('is unseen on a fresh install', async () => {
    const storage = createInMemorySecureStorage();
    await expect(loadOnboardingSeen(storage)).resolves.toBe(false);
  });

  it('remembers that the panels are done', async () => {
    const storage = createInMemorySecureStorage();
    await saveOnboardingSeen(storage);
    await expect(loadOnboardingSeen(storage)).resolves.toBe(true);
  });

  it('treats a corrupt value as unseen, never as seen', async () => {
    const storage = createInMemorySecureStorage();
    await storage.setItem(ONBOARDING_SEEN_STORAGE_KEY, 'yes');
    // Failing this direction shows the panels one extra time; failing the other
    // locks a first-time player out of them entirely.
    await expect(loadOnboardingSeen(storage)).resolves.toBe(false);
  });
});
