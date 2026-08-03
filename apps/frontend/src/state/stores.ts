import type { ThemePreferenceValue } from '@gmrlog/types';
import { create } from 'zustand';

/**
 * Global theme preference store — mirrors UserSettings.appearance.theme vocabulary.
 *
 * `pendingPreference` marks an optimistic write that took the offline-queue
 * branch and has not yet round-tripped the server. While it is set, the
 * settings resync effect must not overwrite `preference` from a fetch — that
 * fetch is reading the still-stale value the queued mutation hasn't reached
 * yet. Cleared once the mutation resolves online (either the original attempt
 * or the reconnect flush).
 */
export interface ThemeStoreState {
  preference: ThemePreferenceValue;
  pendingPreference: ThemePreferenceValue | null;
  setPreference: (preference: ThemePreferenceValue) => void;
  setPendingPreference: (preference: ThemePreferenceValue | null) => void;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  preference: 'system',
  pendingPreference: null,
  setPreference: (preference) => {
    set({ preference });
  },
  setPendingPreference: (pendingPreference) => {
    set({ pendingPreference });
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
