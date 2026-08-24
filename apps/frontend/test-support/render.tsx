import { ThemeProvider, type ThemeProviderProps } from '@gmrlog/ui';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';

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
      <ThemeProvider initialPreference={preference} initialAccent={accent}>
        {children}
      </ThemeProvider>
    ),
    ...renderOptions,
  });
}

export { screen, within, fireEvent, waitFor } from '@testing-library/react';
