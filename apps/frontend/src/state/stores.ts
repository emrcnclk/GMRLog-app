import type { ThemePreferenceValue } from '@gmrlog/types';
import { create } from 'zustand';

/**
 * Global theme preference store — mirrors UserSettings.appearance.theme vocabulary.
 */
export interface ThemeStoreState {
  preference: ThemePreferenceValue;
  setPreference: (preference: ThemePreferenceValue) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  preference: 'system',
  setPreference: (preference) => {
    set({ preference });
  },
}));

/**
 * Connectivity store — offline detection + sync indicators (D3.15).
 */
export interface ConnectivityStoreState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingMutations: number;
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingMutations: (count: number) => void;
}

export const useConnectivityStore = create<ConnectivityStoreState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingMutations: 0,
  setOnline: (isOnline) => {
    set({ isOnline });
  },
  setSyncing: (isSyncing) => {
    set({ isSyncing });
  },
  setPendingMutations: (pendingMutations) => {
    set({ pendingMutations });
  },
}));
