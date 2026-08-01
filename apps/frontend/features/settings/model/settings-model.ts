import type { SettingsResponse, ThemePreferenceValue } from '@gmrlog/types';

import { mapAuthError, type AuthUiError } from '../../../src/auth/map-auth-error';

export type SettingsViewStatus = 'loading' | 'error' | 'ready';

export interface SettingsViewModel {
  status: SettingsViewStatus;
  settings: SettingsResponse | null;
  error: unknown;
  isRefreshing: boolean;
}

export const THEME_OPTIONS: readonly ThemePreferenceValue[] = ['light', 'dark', 'system'];

export function themeLabel(theme: ThemePreferenceValue): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System';
  }
}

export function defaultSettings(): SettingsResponse {
  return {
    appearance: { theme: 'system', locale: null },
    accessibility: { reduceMotion: false },
  };
}

export function resolveSettingsView(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  settings: SettingsResponse | null | undefined;
  isRefreshing: boolean;
}): SettingsViewModel {
  if (input.isPending && !input.settings) {
    return {
      status: 'loading',
      settings: null,
      error: null,
      isRefreshing: false,
    };
  }
  if (input.isError && !input.settings) {
    return {
      status: 'error',
      settings: null,
      error: input.error,
      isRefreshing: input.isRefreshing,
    };
  }
  return {
    status: 'ready',
    settings: input.settings ?? defaultSettings(),
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export function mapSettingsError(error: unknown, isOnline: boolean): AuthUiError {
  return mapAuthError(error, isOnline);
}

export const SETTINGS_HUB_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    subtitle: 'Appearance, accessibility, region',
  },
  {
    id: 'account',
    title: 'Account',
    subtitle: 'Profile, sessions, connected accounts',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    subtitle: 'Steam, sync, CSV import',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Attention preferences',
  },
  {
    id: 'storage',
    title: 'Storage',
    subtitle: 'Caches and local data',
  },
  {
    id: 'diagnostics',
    title: 'Diagnostics',
    subtitle: 'Version, environment, network',
  },
  {
    id: 'about',
    title: 'About',
    subtitle: 'Legal, contact, version',
  },
] as const;

export type SettingsHubSectionId = (typeof SETTINGS_HUB_SECTIONS)[number]['id'];

export function settingsRenderOrder(): readonly SettingsHubSectionId[] {
  return SETTINGS_HUB_SECTIONS.map((section) => section.id);
}
