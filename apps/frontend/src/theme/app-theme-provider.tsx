import { ThemeProvider } from '@gmrlog/ui';
import type { ReactNode } from 'react';

import {
  useCustomizationStore,
  useHydrateCustomization,
} from '../../features/profile/hooks/use-profile-customization';
import { useThemeStore } from '../state/stores';

import { NavigationThemeBridge } from './navigation-theme';

export interface AppThemeProviderProps {
  children: ReactNode;
}

/**
 * Bridges Zustand theme preference ↔ `@gmrlog/ui` ThemeProvider.
 * Preference vocabulary matches UserSettings.appearance.theme.
 *
 * D3.27 also feeds the player's accent choice in. The accent remaps
 * `color.accent.*` only — scheme neutrals are untouched, so choosing an accent
 * can never degrade contrast elsewhere in the app.
 *
 * `NavigationThemeBridge` sits inside, so React Navigation's own theme resolves
 * to the same tokens instead of its light `DefaultTheme` (task 1.5).
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const accent = useCustomizationStore((s) => s.customization.accent);
  const patch = useCustomizationStore((s) => s.patch);

  // Load persisted customization once, at the root, so the first paint already
  // carries the player's accent.
  useHydrateCustomization();

  return (
    <ThemeProvider
      key={`${preference}:${accent}`}
      initialPreference={preference}
      onPreferenceChange={(next) => {
        setPreference(next);
      }}
      initialAccent={accent}
      onAccentChange={(next) => {
        patch({ accent: next });
      }}
    >
      <NavigationThemeBridge>{children}</NavigationThemeBridge>
    </ThemeProvider>
  );
}
