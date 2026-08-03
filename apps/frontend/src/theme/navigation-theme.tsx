import { useTheme } from '@gmrlog/ui';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useMemo, type ReactNode } from 'react';

export interface NavigationThemeBridgeProps {
  children: ReactNode;
}

/**
 * Feeds our tokens into React Navigation's own theme.
 *
 * Expo Router mounts its forked `NavigationContainer` with React Navigation's
 * `DefaultTheme` — a **light** theme (`background #F2F2F2`, `card #FFFFFF`,
 * `text #1C1C1E`, system-ui fonts at weights up to 700). Nothing overrode it, so
 * every navigator container painted a light-grey base layer underneath the app
 * and every navigator-drawn label reached for a family and weight that are not
 * in the ramp. Invisible while a screen covers it edge to edge; visible in the
 * gap during a stack transition, and in the first paint before the label styles
 * resolve.
 *
 * Mounting this inside our `ThemeProvider` replaces that context for every
 * descendant, which is all of the navigators. Nothing new is invented here —
 * each of React Navigation's six colours and four font slots resolves to a
 * token we already ship.
 *
 * `bold` and `heavy` map to Geist-Medium at 500 on purpose: 500 is the ceiling
 * the type scale allows (THEME_MIGRATION.md §4), and a navigator asking for
 * "heavy" must not be able to reach past it.
 */
export function NavigationThemeBridge({ children }: NavigationThemeBridgeProps) {
  const theme = useTheme();
  const { scheme } = theme;

  const navigationTheme = useMemo(() => {
    const body = theme.typography('body');
    const medium = theme.typography('label');

    const regular = {
      fontFamily: body.fontFamily ?? 'System',
      fontWeight: body.fontWeight,
    } as const;
    const emphasis = {
      fontFamily: medium.fontFamily ?? 'System',
      fontWeight: medium.fontWeight,
    } as const;

    return {
      dark: scheme === 'dark',
      colors: {
        primary: theme.color('color.accent.default'),
        background: theme.color('color.background.primary'),
        card: theme.color('color.background.elevated'),
        text: theme.color('color.text.primary'),
        border: theme.color('color.border.default'),
        notification: theme.color('color.status.error'),
      },
      fonts: {
        regular,
        medium: emphasis,
        bold: emphasis,
        heavy: emphasis,
      },
    };
  }, [theme, scheme]);

  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}
