import { FONT_FAMILY } from './tokens';
import type {
  AccentKey,
  ElevationStyle,
  RarityTier,
  ResolvedColorScheme,
  SemanticColorPalette,
  SemanticElevationScale,
  SemanticElevationToken,
  SemanticRadiusScale,
  SemanticRadiusToken,
  SemanticSpaceToken,
  SemanticSpaceScale,
  SemanticTypographyScale,
  ThemeTokens,
  TypographyStyle,
} from './tokens';

/**
 * Structural neutral remaps for light/dark under the same semantic names (F4.10 §9).
 * Chromatic brand primitives are not selected here — DESIGN_TOKENS.md lists names only.
 * These neutrals exist so ThemeProvider can resolve schemes without inventing engagement colors.
 */
const lightColors: SemanticColorPalette = {
  'color.background.primary': '#FBFBFD',
  'color.background.secondary': '#F3F4F8',
  'color.background.tertiary': '#E9EAF1',
  'color.background.elevated': '#FFFFFF',
  'color.surface.primary': '#FFFFFF',
  'color.surface.secondary': '#F3F4F8',
  'color.surface.card': '#FFFFFF',
  'color.surface.dialog': '#FFFFFF',
  'color.text.primary': '#16182A',
  'color.text.secondary': '#4A4E63',
  'color.text.tertiary': '#66697A',
  'color.text.disabled': '#A5A8B8',
  'color.text.inverse': '#FBFBFD',
  'color.border.default': 'rgba(22,24,42,0.10)',
  'color.border.focus': '#6F5FD0',
  'color.border.error': '#DC2626',
  'color.status.success': '#15803D',
  'color.status.warning': '#A16207',
  'color.status.error': '#DC2626',
  'color.status.info': '#1D4ED8',
  'color.interactive.primary': '#16182A',
  'color.interactive.secondary': '#4A4E63',
  'color.interactive.disabled': '#A5A8B8',
  'color.accent.default': '#16182A',
  'color.accent.muted': 'rgba(22,24,42,0.12)',
  'color.accent.onAccent': '#FBFBFD',
  'color.rarity.common': '#8A8DA0',
  'color.rarity.uncommon': '#6C7085',
  'color.rarity.rare': '#4A4E63',
  'color.rarity.epic': '#6F5FD0',
  'color.rarity.legendary': '#16182A',
  'color.scrim.strong': 'rgba(22,24,42,0.82)',
  'color.scrim.soft': 'rgba(22,24,42,0.38)',
  'color.scrim.foreground': '#F3F5FE',
};

const darkColors: SemanticColorPalette = {
  'color.background.primary': '#161826',
  'color.background.secondary': '#1B1D2E',
  'color.background.tertiary': '#232532',
  'color.background.elevated': '#181A29',
  'color.surface.primary': '#1B1D2E',
  'color.surface.secondary': '#232532',
  'color.surface.card': '#202234',
  'color.surface.dialog': '#232532',
  'color.text.primary': '#F3F5FE',
  'color.text.secondary': '#B2B6CA',
  'color.text.tertiary': '#888CA2',
  'color.text.disabled': '#595D6C',
  'color.text.inverse': '#161826',
  'color.border.default': 'rgba(233,233,237,0.08)',
  'color.border.focus': '#9184D9',
  'color.border.error': '#F87171',
  'color.status.success': '#6EE7A8',
  'color.status.warning': '#E9C46A',
  'color.status.error': '#F87171',
  'color.status.info': '#8FB4F5',
  'color.interactive.primary': '#E9E9ED',
  'color.interactive.secondary': '#B2B6CA',
  'color.interactive.disabled': '#595D6C',
  'color.accent.default': '#E9E9ED',
  'color.accent.muted': 'rgba(233,233,237,0.14)',
  'color.accent.onAccent': '#161826',
  'color.rarity.common': '#75798C',
  'color.rarity.uncommon': '#9397AB',
  'color.rarity.rare': '#B2B6CA',
  'color.rarity.epic': '#D2CEFD',
  'color.rarity.legendary': '#F3F5FE',
  'color.scrim.strong': 'rgba(22,24,38,0.86)',
  'color.scrim.soft': 'rgba(22,24,38,0.42)',
  'color.scrim.foreground': '#F3F5FE',
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
    light: { default: '#6F5FD0', muted: 'rgba(111,95,208,0.12)', onAccent: '#FFFFFF' },
    dark: { default: '#9184D9', muted: 'rgba(145,132,217,0.16)', onAccent: '#141527' },
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

/**
 * The shape channels of a rarity tier.
 *
 * `radius` and `elevation` are the plate channels; `notch` is the fallback for
 * a slot too small to hold a radius ramp — the length of the leading rule on a
 * `RarityBadge`.
 */
export interface RarityGeometry {
  radius: SemanticRadiusToken;
  elevation: SemanticElevationToken;
  notch: SemanticSpaceToken;
}

/**
 * Rarity is geometry, not colour (THEME_MIGRATION.md §5). Corners sharpen and an
 * ambient glow arrives as the tier climbs, so rank survives the `neutral` accent
 * and monochrome: legendary is a square plate that glows, common is a circle
 * with a hairline and no lift.
 *
 * **The radius channel needs a plate of at least 32px.** React Native clamps
 * `borderRadius` to half the box, so below that the top of the ramp collapses:
 * at 32 the half is 16 and `sm`/`md`/`lg`/`xl` all resolve, with only `full`
 * clamping — which is what common is meant to be anyway. `2xl` is 18 and would
 * clamp too, so the ramp skips it. Plates are 30–38px in
 * the prototype; anything smaller must carry the tier on `notch` and
 * `elevation` instead, which is three steps rather than five and is why the two
 * fallback channels are here beside the primary one.
 */
const RARITY_GEOMETRY: Record<RarityTier, RarityGeometry> = {
  common: { radius: 'radius.full', elevation: 'shadow.none', notch: 'space.2' },
  uncommon: { radius: 'radius.xl', elevation: 'shadow.none', notch: 'space.3' },
  rare: { radius: 'radius.lg', elevation: 'shadow.none', notch: 'space.4' },
  epic: { radius: 'radius.md', elevation: 'shadow.sm', notch: 'space.4' },
  legendary: { radius: 'radius.sm', elevation: 'shadow.md', notch: 'space.4' },
};

/** The smallest plate on which the rarity radius ramp resolves (px). */
export const RARITY_PLATE_MIN = 32;

/** Resolve the shape tokens that encode a rarity tier's rank. */
export function rarityGeometry(tier: RarityTier): RarityGeometry {
  return RARITY_GEOMETRY[tier];
}

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

/**
 * Radius scale — shared across schemes (DESIGN_TOKENS.md · THEME_MIGRATION.md §5).
 *
 * `sm` stays 4 because rarity plates are deliberately square-ish: squareness
 * reads as rank. `full` stays 9999 rather than the doc's 999 — no visual
 * difference at any real size, and 9999 is what every existing pill resolves to.
 */
export const radiusScale: SemanticRadiusScale = {
  'radius.none': 0,
  'radius.sm': 4,
  'radius.md': 8,
  'radius.lg': 11,
  'radius.xl': 14,
  'radius.2xl': 18,
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

/**
 * Typography roles — shared across schemes (F4.3 · reading before decoration ·
 * THEME_MIGRATION.md §4b).
 *
 * Ten steps, not the ~19 distinct sizes the redesign docs name. Those came from
 * a prototype authored freehand with inline styles, where the gap between 13.5
 * and 14 is drift rather than intent; the mapping table in §4b rounds each doc
 * value onto a step here. If a screen cannot be built on this ramp, raise it —
 * do not inline a size.
 *
 * `letterSpacing` is px. The doc's em values are converted against the size:
 * `metaSm` .14em × 9 = 1.26, `meta` .05em × 11 = 0.55, `title1` −0.03em × 32 ≈ −1.
 */
const display: TypographyStyle = {
  fontSize: 40,
  lineHeight: 44,
  fontWeight: '300',
  letterSpacing: -1.5,
  fontFamily: FONT_FAMILY.sansLight,
};
const title1: TypographyStyle = {
  fontSize: 32,
  lineHeight: 38,
  fontWeight: '300',
  letterSpacing: -1,
  fontFamily: FONT_FAMILY.sansLight,
};
const title2: TypographyStyle = {
  fontSize: 25,
  lineHeight: 30,
  fontWeight: '300',
  letterSpacing: -0.5,
  fontFamily: FONT_FAMILY.sansLight,
};
const title3: TypographyStyle = {
  fontSize: 21,
  lineHeight: 26,
  fontWeight: '400',
  letterSpacing: 0,
  fontFamily: FONT_FAMILY.sansRegular,
};
const headline: TypographyStyle = {
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '500',
  letterSpacing: 0,
  fontFamily: FONT_FAMILY.sansMedium,
};
const body: TypographyStyle = {
  fontSize: 15,
  lineHeight: 24,
  fontWeight: '400',
  letterSpacing: 0,
  fontFamily: FONT_FAMILY.sansRegular,
};
const bodySm: TypographyStyle = {
  fontSize: 13,
  lineHeight: 20,
  fontWeight: '400',
  letterSpacing: 0,
  fontFamily: FONT_FAMILY.sansRegular,
};
const label: TypographyStyle = {
  fontSize: 12,
  lineHeight: 16,
  fontWeight: '500',
  letterSpacing: 0.1,
  fontFamily: FONT_FAMILY.sansMedium,
};
const meta: TypographyStyle = {
  fontSize: 11,
  lineHeight: 14,
  fontWeight: '400',
  letterSpacing: 0.55,
  fontFamily: FONT_FAMILY.mono,
  textTransform: 'uppercase',
};
const metaSm: TypographyStyle = {
  fontSize: 9,
  lineHeight: 12,
  fontWeight: '400',
  letterSpacing: 1.26,
  fontFamily: FONT_FAMILY.mono,
  textTransform: 'uppercase',
};

export const typographyScale: SemanticTypographyScale = {
  display,
  title1,
  title2,
  title3,
  headline,
  body,
  bodySm,
  label,
  meta,
  metaSm,

  // Deprecated aliases — see the note on `SemanticTypeRole`. They reference the
  // ramp entries directly so an alias can never drift from its target. Delete
  // all three when Phase 3b lands.
  heading: title2,
  title: headline,
  caption: bodySm,
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
