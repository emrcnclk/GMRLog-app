import { create } from 'zustand';

import { DEFAULT_LOCAL_UI_PREFS, type LocalUiPrefs } from '../validators/settings-form';

export interface LocalUiPrefsStore extends LocalUiPrefs {
  setLargerText: (value: boolean) => void;
  setHighContrast: (value: boolean) => void;
  setDateFormat: (value: LocalUiPrefs['dateFormat']) => void;
  setRegion: (value: string | null) => void;
  reset: () => void;
}

/**
 * Local-only preferences (larger text · high contrast · date · region).
 * Not part of SettingsResponse — never PATCH invented fields.
 */
export const useLocalUiPrefsStore = create<LocalUiPrefsStore>((set) => ({
  ...DEFAULT_LOCAL_UI_PREFS,
  setLargerText: (largerText) => {
    set({ largerText });
  },
  setHighContrast: (highContrast) => {
    set({ highContrast });
  },
  setDateFormat: (dateFormat) => {
    set({ dateFormat });
  },
  setRegion: (region) => {
    set({ region });
  },
  reset: () => {
    set({ ...DEFAULT_LOCAL_UI_PREFS });
  },
}));
