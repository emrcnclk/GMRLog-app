/**
 * Semantic color token paths (DESIGN_TOKENS.md · F4.10).
 * Components consume these names — never primitives or raw hex.
 */
export type SemanticColorToken =
  | 'color.background.primary'
  | 'color.background.secondary'
  | 'color.background.tertiary'
  | 'color.background.elevated'
  | 'color.surface.primary'
  | 'color.surface.secondary'
  | 'color.surface.card'
  | 'color.surface.dialog'
  | 'color.text.primary'
  | 'color.text.secondary'
  | 'color.text.tertiary'
  | 'color.text.disabled'
  | 'color.text.inverse'
  | 'color.border.default'
  | 'color.border.focus'
  | 'color.border.error'
  | 'color.status.success'
  | 'color.status.warning'
  | 'color.status.error'
  | 'color.status.info'
  | 'color.interactive.primary'
  | 'color.interactive.secondary'
  | 'color.interactive.disabled'
  /**
   * D3.27 — accent family. Remapped at runtime by the user's accent choice
   * (PROFILE_CUSTOMIZATION.md). Neutral by default so the system stays
   * monochrome unless a player opts in.
   */
  | 'color.accent.default'
  | 'color.accent.muted'
  | 'color.accent.onAccent'
  /** D3.27 — rarity family for achievements / archetypes. Meaning, not decoration. */
  | 'color.rarity.common'
  | 'color.rarity.uncommon'
  | 'color.rarity.rare'
  | 'color.rarity.epic'
  | 'color.rarity.legendary'
  /** D3.27 — scrim family for artwork overlays; keeps text legible over any cover. */
  | 'color.scrim.strong'
  | 'color.scrim.soft'
  /**
   * D3.28 — foreground for content drawn *on* a scrim.
   *
   * Deliberately identical in both schemes. A scrim is dark in light mode and
   * dark in dark mode, so anything on top of it must stay light either way.
   * `color.text.inverse` flips with the scheme and therefore renders a near-black
   * glyph on a near-black scrim in dark mode — the trap this token exists to
   * close.
   */
  | 'color.scrim.foreground';

/**
 * D3.27 — selectable accent identities (PROFILE_CUSTOMIZATION.md).
 * `neutral` keeps the frozen monochrome system; the rest remap `color.accent.*`.
 */
export type AccentKey =
  'neutral' | 'ember' | 'plasma' | 'toxic' | 'cobalt' | 'magma' | 'orchid' | 'gold';

/** D3.27 — rarity tiers shared by achievements and archetypes. */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Spacing token paths — 8pt grid (DESIGN_TOKENS.md).
 * Values are remapped by theme packages; components take token keys only.
 */
export type SemanticSpaceToken =
  | 'space.0'
  | 'space.1'
  | 'space.2'
  | 'space.3'
  | 'space.4'
  | 'space.5'
  | 'space.6'
  | 'space.8'
  | 'space.10'
  | 'space.12'
  | 'space.16'
  | 'space.20'
  | 'space.24';

/** Radius token paths (DESIGN_TOKENS.md). */
export type SemanticRadiusToken =
  | 'radius.none'
  | 'radius.sm'
  | 'radius.md'
  | 'radius.lg'
  | 'radius.xl'
  | 'radius.2xl'
  | 'radius.full';

/** Elevation / shadow token paths (DESIGN_TOKENS.md · RN shadow props). */
export type SemanticElevationToken =
  'shadow.none' | 'shadow.sm' | 'shadow.md' | 'shadow.lg' | 'shadow.xl';

/** Semantic type roles (S4 Text atom · F4.3). */
export type SemanticTypeRole =
  'display' | 'heading' | 'title' | 'body' | 'label' | 'caption' | 'meta';

export type ThemePreference = 'light' | 'dark' | 'system';

export type ResolvedColorScheme = 'light' | 'dark';

export type SemanticColorPalette = Record<SemanticColorToken, string>;

export type SemanticSpaceScale = Record<SemanticSpaceToken, number>;

export type SemanticRadiusScale = Record<SemanticRadiusToken, number>;

export interface ElevationStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export type SemanticElevationScale = Record<SemanticElevationToken, ElevationStyle>;

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing: number;
}

export type SemanticTypographyScale = Record<SemanticTypeRole, TypographyStyle>;

export interface ThemeTokens {
  scheme: ResolvedColorScheme;
  /** D3.27 — accent identity currently remapped into `color.accent.*`. */
  accent: AccentKey;
  color: SemanticColorPalette;
  space: SemanticSpaceScale;
  radius: SemanticRadiusScale;
  elevation: SemanticElevationScale;
  typography: SemanticTypographyScale;
}
