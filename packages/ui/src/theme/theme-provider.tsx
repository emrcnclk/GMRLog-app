import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

import { createThemeTokens } from './palettes';
import type {
  AccentKey,
  ElevationStyle,
  ResolvedColorScheme,
  SemanticColorToken,
  SemanticElevationToken,
  SemanticRadiusToken,
  SemanticSpaceToken,
  SemanticTypeRole,
  ThemePreference,
  ThemeTokens,
  TypographyStyle,
} from './tokens';

export interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** D3.27 — accent identity; remaps `color.accent.*` only. */
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  scheme: ResolvedColorScheme;
  tokens: ThemeTokens;
  color: (token: SemanticColorToken) => string;
  space: (token: SemanticSpaceToken) => number;
  radius: (token: SemanticRadiusToken) => number;
  elevation: (token: SemanticElevationToken) => ElevationStyle;
  typography: (role: SemanticTypeRole) => TypographyStyle;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(preference: ThemePreference, system: ColorSchemeName): ResolvedColorScheme {
  if (preference === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** Initial preference — default honors system (F6.2 §14.2). */
  initialPreference?: ThemePreference;
  onPreferenceChange?: (preference: ThemePreference) => void;
  /** D3.27 — initial accent identity (default `neutral` keeps the frozen palette). */
  initialAccent?: AccentKey;
  onAccentChange?: (accent: AccentKey) => void;
}

/**
 * Theme provider — remaps values under the same semantic token names (F4.10).
 * Feature code stays theme-blind: consume token accessors only.
 */
export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
  initialAccent = 'neutral',
  onAccentChange,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const [accent, setAccentState] = useState<AccentKey>(initialAccent);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // `initialPreference`/`initialAccent` only seed state on mount by default,
  // but a caller with an external source of truth (a store one level up, or
  // a sibling draft value) needs a change in that prop to actually take —
  // without this, the only way to pick up a new value was a full remount via
  // `key`, which took the entire subtree down with it (3b.6a). Setting state
  // to a value it already holds is a no-op re-render, so this doesn't fight
  // a change that originated from this provider's own `setPreference`/
  // `setAccent` and round-tripped back through `onPreferenceChange`/
  // `onAccentChange`.
  useEffect(() => {
    setPreferenceState(initialPreference);
  }, [initialPreference]);

  useEffect(() => {
    setAccentState(initialAccent);
  }, [initialAccent]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange],
  );

  const setAccent = useCallback(
    (next: AccentKey) => {
      setAccentState(next);
      onAccentChange?.(next);
    },
    [onAccentChange],
  );

  const scheme = resolveScheme(preference, systemScheme);
  const tokens = useMemo(() => createThemeTokens(scheme, accent), [scheme, accent]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      accent,
      setAccent,
      scheme,
      tokens,
      color: (token) => tokens.color[token],
      space: (token) => tokens.space[token],
      radius: (token) => tokens.radius[token],
      elevation: (token) => tokens.elevation[token],
      typography: (role) => tokens.typography[role],
    }),
    [preference, setPreference, accent, setAccent, scheme, tokens],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider (@gmrlog/ui)');
  }
  return context;
}
