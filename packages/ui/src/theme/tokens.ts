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

/**
 * Semantic type roles — the ten-step ramp (S4 Text atom · F4.3 ·
 * THEME_MIGRATION.md §4b).
 *
 * `meta` and `metaSm` are the only monospace roles. They differ by tracking, not
 * just size: `metaSm` is a section kicker standing alone at .14em, `meta` is
 * inline metadata inside a row, where .14em stops reading as words.
 */
export type SemanticTypeRole =
  | 'display'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'meta'
  | 'metaSm'
  /**
   * Deprecated aliases onto the ramp above (`heading`→`title2`, `title`→
   * `headline`, `caption`→`bodySm`). They exist so the 122 call sites across 91
   * files keep rendering while Phase 3 recomposes each screen and swaps its own
   * role names. Delete all three when Phase 3b lands; task 8.4 checks that this
   * union is back to ten members.
   */
  | 'heading'
  | 'title'
  | 'caption';

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

/**
 * Registered font family names — these are the names `Font.loadAsync` maps the
 * `.ttf` files to in `apps/frontend/lib/fonts/load-fonts.ts`, so the two must
 * agree exactly.
 *
 * Both families ship as static files, one per weight. Variable fonts are
 * deliberately avoided: React Native's `fontWeight` does not drive a variable
 * axis on Android, so a variable file renders a single weight everywhere.
 */
export const FONT_FAMILY = {
  /** Geist — SIL OFL. Weight 300. */
  sansLight: 'Geist-Light',
  /** Geist — SIL OFL. Weight 400. */
  sansRegular: 'Geist-Regular',
  /** Geist — SIL OFL. Weight 500. */
  sansMedium: 'Geist-Medium',
  /**
   * IBM Plex Mono — SIL OFL. Weight 400, the only weight the mono roles use.
   * Chosen for full Latin Extended-A: GMRLog is a Turkish product, so `ğ ı ş İ`
   * must be real glyphs rather than substitutions from a fallback family — in a
   * monospace face a substituted glyph is obvious, since every advance is equal.
   */
  mono: 'IBMPlexMono-Regular',
} as const;

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  /**
   * 300–500 only — hierarchy comes from size, colour and space, never from
   * shouting. `200` is headroom for display sizes and is currently unused.
   */
  fontWeight: '200' | '300' | '400' | '500';
  /** Pixels. React Native has no `em`, so doc values are converted at authoring time. */
  letterSpacing: number;
  /**
   * Set on every role rather than left to `fontWeight`. On Android a custom
   * family only resolves the weight baked into the named file, so the family and
   * the weight have to be chosen together.
   */
  fontFamily?: string;
  /** Mono roles only. */
  textTransform?: 'uppercase';
}

export type SemanticTypographyScale = Record<SemanticTypeRole, TypographyStyle>;

/**
 * Tablet breakpoint (8.1 Cross-platform pass) — pixels, `useWindowDimensions`
 * width compared with `>=`. The one value every screen and shared primitive
 * branches on; nothing may inline its own comparison number. Not
 * scheme-dependent, so it lives as a plain export rather than inside
 * `ThemeTokens` alongside `color`/`space`/`radius`. 768 matches the low end of
 * the standard 10" tablet/iPad-mini viewport class, and the app's own
 * `resize_window` "tablet" preset (768×1024).
 */
export const TABLET_BREAKPOINT = 768;

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
