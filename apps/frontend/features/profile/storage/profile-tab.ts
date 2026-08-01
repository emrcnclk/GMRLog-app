import type { SecureStorage } from '../../../lib/storage/secure-storage';
import { isProfileTabId, type ProfileTabId } from '../hooks/profile-model';

export const PROFILE_TAB_STORAGE_KEY = 'gmrlog.profile.lastTab';
export const PROFILE_TAB_DEFAULT: ProfileTabId = 'overview';

export async function loadProfileTab(storage: SecureStorage): Promise<ProfileTabId> {
  const raw = await storage.getItem(PROFILE_TAB_STORAGE_KEY);
  if (!raw) {
    return PROFILE_TAB_DEFAULT;
  }
  return isProfileTabId(raw) ? raw : PROFILE_TAB_DEFAULT;
}

export async function saveProfileTab(storage: SecureStorage, tab: ProfileTabId): Promise<void> {
  await storage.setItem(PROFILE_TAB_STORAGE_KEY, tab);
}
