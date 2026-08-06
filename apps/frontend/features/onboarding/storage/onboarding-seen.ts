import type { SecureStorage } from '../../../lib/storage/secure-storage';

/**
 * `SCREEN_REDESIGNS.md` §3 via 0.1: this task "owns whatever decides when
 * onboarding is shown and when it is done".
 *
 * It is done when the player has either walked the three panels or skipped
 * them — one bit, stored locally. Local is the right home: onboarding is about
 * this install's first run, not about an account (a player who has seen it on a
 * phone should still see it on a first web visit, and there is no DTO for it —
 * inventing a server field would be inventing an endpoint). The same
 * `SecureStorage` seam the profile tab and recent searches already use, so there
 * is one storage abstraction in the app and not two.
 */
export const ONBOARDING_SEEN_STORAGE_KEY = 'gmrlog.onboarding.seen';

const SEEN_VALUE = 'true';

export async function loadOnboardingSeen(storage: SecureStorage): Promise<boolean> {
  const raw = await storage.getItem(ONBOARDING_SEEN_STORAGE_KEY);
  // Anything other than the exact marker counts as unseen: a corrupt value
  // should show the panels again, never lock a first-time player out of them.
  return raw === SEEN_VALUE;
}

export async function saveOnboardingSeen(storage: SecureStorage): Promise<void> {
  await storage.setItem(ONBOARDING_SEEN_STORAGE_KEY, SEEN_VALUE);
}
