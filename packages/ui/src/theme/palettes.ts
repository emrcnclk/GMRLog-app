import type {
  AccentKey,
  ElevationStyle,
  RarityTier,
  ResolvedColorScheme,
  SemanticColorPalette,
  SemanticElevationScale,
  SemanticRadiusScale,
  SemanticSpaceScale,
  SemanticTypographyScale,
  ThemeTokens,
} from './tokens';

/**
 * Structural neutral remaps for light/dark under the same semantic names (F4.10 §9).
 * Chromatic brand primitives are not selected here — DESIGN_TOKENS.md lists names only.
 * These neutrals exist so ThemeProvider can resolve schemes without inventing engagement colors.
 */
const lightColors: SemanticColorPalette = {
  'color.background.primary': '#FFFFFF',
  'color.background.secondary': '#F4F4F5',
  'color.background.tertiary': '#E4E4E7',
  'color.background.elevated': '#FFFFFF',
  'color.surface.primary': '#FFFFFF',
  'color.surface.secondary': '#F4F4F5',
  'color.surface.card': '#FFFFFF',
  'color.surface.dialog': '#FFFFFF',
  'color.text.primary': '#18181B',
  'color.text.secondary': '#3F3F46',
  'color.text.tertiary': '#71717A',
  'color.text.disabled': '#A1A1AA',
  'color.text.inverse': '#FAFAFA',
  'color.border.default': '#D4D4D8',
  'color.border.focus': '#52525B',
  'color.border.error': '#B91C1C',
  'color.status.success': '#15803D',
  'color.status.warning': '#A16207',
  'color.status.error': '#B91C1C',
  'color.status.info': '#1D4ED8',
  'color.interactive.primary': '#18181B',
  'color.interactive.secondary': '#52525B',
  'color.interactive.disabled': '#A1A1AA',
  'color.accent.default': '#18181B',
  'color.accent.muted': '#E4E4E7',
  'color.accent.onAccent': '#FAFAFA',
  'color.rarity.common': '#71717A',
  'color.rarity.uncommon': '#15803D',
  'color.rarity.rare': '#1D4ED8',
  'color.rarity.epic': '#6D28D9',
  'color.rarity.legendary': '#B45309',
  'color.scrim.strong': 'rgba(9,9,11,0.78)',
  'color.scrim.soft': 'rgba(9,9,11,0.35)',
  'color.scrim.foreground': '#FAFAFA',
};

const darkColors: SemanticColorPalette = {
  'color.background.primary': '#09090B',
  'color.background.secondary': '#18181B',
  'color.background.tertiary': '#27272A',
  'color.background.elevated': '#18181B',
  'color.surface.primary': '#18181B',
  'color.surface.secondary': '#27272A',
  'color.surface.card': '#18181B',
  'color.surface.dialog': '#27272A',
  'color.text.primary': '#FAFAFA',
  'color.text.secondary': '#D4D4D8',
  'color.text.tertiary': '#A1A1AA',
  'color.text.disabled': '#71717A',
  'color.text.inverse': '#18181B',
  'color.border.default': '#3F3F46',
  'color.border.focus': '#A1A1AA',
  'color.border.error': '#F87171',
  'color.status.success': '#4ADE80',
  'color.status.warning': '#FBBF24',
  'color.status.error': '#F87171',
  'color.status.info': '#60A5FA',
  'color.interactive.primary': '#FAFAFA',
  'color.interactive.secondary': '#D4D4D8',
  'color.interactive.disabled': '#71717A',
  'color.accent.default': '#FAFAFA',
  'color.accent.muted': '#27272A',
  'color.accent.onAccent': '#18181B',
  'color.rarity.common': '#A1A1AA',
  'color.rarity.uncommon': '#4ADE80',
  'color.rarity.rare': '#60A5FA',
  'color.rarity.epic': '#C084FC',
  'color.rarity.legendary': '#FBBF24',
  'color.scrim.strong': 'rgba(0,0,0,0.82)',
  'color.scrim.soft': 'rgba(0,0,0,0.40)',
  'color.scrim.foreground': '#FAFAFA',
};

/**
 * D3.27 accent identities. Each entry only remaps `color.accent.*` — nothing else
 * in the palette moves, so an accent can never break contrast elsewhere.
 * `default` values are chosen to clear 4.5:1 against their scheme background.
 */
interface AccentDefinition {
  default: string;
  muted: string;
  onAccent: string;
}

const accentPalettes: Record<AccentKey, Record<ResolvedColorScheme, AccentDefinition>> = {
  neutral: {
    light: { default: '#18181B', muted: '#E4E4E7', onAccent: '#FAFAFA' },
    dark: { default: '#FAFAFA', muted: '#27272A', onAccent: '#18181B' },
  },
  ember: {
    light: { default: '#C2410C', muted: '#FFEDD5', onAccent: '#FFFFFF' },
    dark: { default: '#FB923C', muted: '#3A1D0B', onAccent: '#1C0A02' },
  },
  plasma: {
    light: { default: '#6D28D9', muted: '#EDE9FE', onAccent: '#FFFFFF' },
    dark: { default: '#A78BFA', muted: '#2A1D46', onAccent: '#160B2B' },
  },
  toxic: {
    light: { default: '#15803D', muted: '#DCFCE7', onAccent: '#FFFFFF' },
    dark: { default: '#4ADE80', muted: '#0C2C18', onAccent: '#04170B' },
  },
  cobalt: {
    light: { default: '#1D4ED8', muted: '#DBEAFE', onAccent: '#FFFFFF' },
    dark: { default: '#60A5FA', muted: '#122344', onAccent: '#04122B' },
  },
  magma: {
    light: { default: '#BE123C', muted: '#FFE4E6', onAccent: '#FFFFFF' },
    dark: { default: '#FB7185', muted: '#3D1119', onAccent: '#22040A' },
  },
  orchid: {
    light: { default: '#A21CAF', muted: '#FAE8FF', onAccent: '#FFFFFF' },
    dark: { default: '#E879F9', muted: '#3A103D', onAccent: '#210423' },
  },
  gold: {
    light: { default: '#A16207', muted: '#FEF9C3', onAccent: '#FFFFFF' },
    dark: { default: '#FBBF24', muted: '#3A2A06', onAccent: '#1F1502' },
  },
};

/** Ordered accent vocabulary for pickers — `neutral` first (the frozen default). */
export const ACCENT_KEYS: readonly AccentKey[] = [
  'neutral',
  'ember',
  'plasma',
  'toxic',
  'cobalt',
  'magma',
  'orchid',
  'gold',
];

export const ACCENT_LABELS: Record<AccentKey, string> = {
  neutral: 'Neutral',
  ember: 'Ember',
  plasma: 'Plasma',
  toxic: 'Toxic',
  cobalt: 'Cobalt',
  magma: 'Magma',
  orchid: 'Orchid',
  gold: 'Gold',
};

/** Rarity vocabulary, ordered low → high. */
export const RARITY_TIERS: readonly RarityTier[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export const RARITY_LABELS: Record<RarityTier, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

/** 8pt grid — DESIGN_TOKENS.md space.* keys. */
export const spaceScale: SemanticSpaceScale = {
  'space.0': 0,
  'space.1': 4,
  'space.2': 8,
  'space.3': 12,
  'space.4': 16,
  'space.5': 20,
  'space.6': 24,
  'space.8': 32,
  'space.10': 40,
  'space.12': 48,
  'space.16': 64,
  'space.20': 80,
  'space.24': 96,
};

/** Radius scale — shared across schemes (DESIGN_TOKENS.md). */
export const radiusScale: SemanticRadiusScale = {
  'radius.none': 0,
  'radius.sm': 4,
  'radius.md': 8,
  'radius.lg': 12,
  'radius.xl': 16,
  'radius.2xl': 24,
  'radius.full': 9999,
};

function createElevation(
  offsetY: number,
  opacity: number,
  radius: number,
  androidElevation: number,
): ElevationStyle {
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: androidElevation,
  };
}

/** Elevation scale — shared across schemes (RN shadow + Android elevation). */
export const elevationScale: SemanticElevationScale = {
  'shadow.none': createElevation(0, 0, 0, 0),
  'shadow.sm': createElevation(1, 0.08, 2, 1),
  'shadow.md': createElevation(2, 0.12, 4, 3),
  'shadow.lg': createElevation(4, 0.16, 8, 6),
  'shadow.xl': createElevation(8, 0.2, 16, 12),
};

/** Typography roles — shared across schemes (F4.3 · reading before decoration). */
export const typographyScale: SemanticTypographyScale = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -0.5 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.3 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.2 },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.15 },
};

export function createThemeTokens(
  scheme: ResolvedColorScheme,
  accent: AccentKey = 'neutral',
): ThemeTokens {
  const base = scheme === 'light' ? lightColors : darkColors;
  const chosen = accentPalettes[accent][scheme];

  return {
    scheme,
    accent,
    color: {
      ...base,
      'color.accent.default': chosen.default,
      'color.accent.muted': chosen.muted,
      'color.accent.onAccent': chosen.onAccent,
    },
    space: spaceScale,
    radius: radiusScale,
    elevation: elevationScale,
    typography: typographyScale,
  };
}
