import { ThemeProvider, type ThemeProviderProps } from '@gmrlog/ui';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * A fixed frame and a fixed set of insets, so a component reading
 * `useSafeAreaInsets()` mounts instead of throwing "No safe area value
 * available". The numbers are a phone with a notch — the case worth having as
 * the default, since a zero inset is the one that hides top-inset bugs.
 */
const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Mount a component the way the app mounts it.
 *
 * Everything in `@gmrlog/ui` resolves its values through `useTheme()`, which
 * throws outside a provider, so a bare `render()` fails on the first token
 * lookup. Defaults match the app's own: the `neutral` accent and the `dark`
 * scheme, which is what `AppThemeProvider` starts from.
 *
 * Pass `preference: 'light'` to assert the light half of a token pair — the
 * scheme flip is where CLAUDE.md's scrim rule gets broken, and it is not
 * something a computed style in one scheme can catch.
 */
export function renderWithTheme(
  ui: ReactElement,
  options: RenderOptions & {
    preference?: ThemeProviderProps['initialPreference'];
    accent?: ThemeProviderProps['initialAccent'];
  } = {},
): RenderResult {
  const { preference = 'dark', accent = 'neutral', ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <ThemeProvider initialPreference={preference} initialAccent={accent}>
          {children}
        </ThemeProvider>
      </SafeAreaProvider>
    ),
    ...renderOptions,
  });
}

export { screen, within, fireEvent, waitFor } from '@testing-library/react';
