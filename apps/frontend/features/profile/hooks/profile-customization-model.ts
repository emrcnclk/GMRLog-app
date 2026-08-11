import type { AccentKey } from '@gmrlog/ui';

/**
 * D3.27 Phase 5 — Profile customization model.
 *
 * **Storage scope:** this store is the device-local mirror. D3.29 (3b.6, the
 * Customize Profile screen) added `GET/PATCH /me/profile-theme`, so `accent`,
 * `cardStyle`, `bannerStyle`, `favoritePlatform`, `consoleGeneration` and the
 * widget-layout fields now round-trip through the server — the shape below
 * was deliberately kept identical to that DTO for exactly this swap. This
 * store is written through only after a confirmed save (`use-profile-theme.ts`),
 * so the rest of the app keeps reading it synchronously rather than every
 * consumer switching to the query. `heroStyle` has no server column — it
 * shipped in §6, after `PROFILE_CUSTOMIZATION.md`'s stored shape was written —
 * and stays device-local only. See `docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md`.
 *
 * Covered by `profile-customization-model.spec.ts`.
 */

/** Card treatment for profile surfaces. */
export type ProfileCardStyle = 'elevated' | 'flat' | 'outlined';

/** Banner treatment behind the profile hero. */
export type ProfileBannerStyle = 'artwork' | 'gradient' | 'solid';

/**
 * §6 ships three hero treatments and says to build the card — "the strongest and
 * the one the whole product is named after" — while keeping the other two
 * "behind the variant switch". This is that switch.
 *
 * `banner` is the pre-redesign `ProfilePremiumHero`, kept rather than deleted;
 * `monolith` is §6's plain-background alternate. `card` is the default because
 * it is what §6 asks the screen to be.
 */
export type ProfileHeroStyle = 'card' | 'monolith' | 'banner';

/** Console generations a player can fly as identity. */
export type ConsoleGeneration = 'retro' | 'gen6' | 'gen7' | 'gen8' | 'gen9' | 'pc' | 'handheld';

export const CONSOLE_GENERATION_LABELS: Record<ConsoleGeneration, string> = {
  retro: 'Retro (pre-2000)',
  gen6: '6th gen — PS2 · Xbox · GameCube',
  gen7: '7th gen — PS3 · X360 · Wii',
  gen8: '8th gen — PS4 · Xbox One · Switch',
  gen9: '9th gen — PS5 · Series X|S',
  pc: 'PC',
  handheld: 'Handheld',
};

/**
 * Platform identity vocabulary. This is a *preference*, not a derived fact —
 * `LibraryGameSummary` carries no platform, so there is nothing to infer from.
 * A closed list keeps the value comparable between players.
 */
export const FAVORITE_PLATFORM_OPTIONS: readonly string[] = [
  'PC',
  'PlayStation',
  'Xbox',
  'Nintendo',
  'Steam Deck',
  'Mobile',
  'VR',
  'Retro',
];

export const CARD_STYLE_LABELS: Record<ProfileCardStyle, string> = {
  elevated: 'Elevated',
  flat: 'Flat',
  outlined: 'Outlined',
};

export const BANNER_STYLE_LABELS: Record<ProfileBannerStyle, string> = {
  artwork: 'Artwork',
  gradient: 'Gradient',
  solid: 'Solid',
};

export const HERO_STYLE_LABELS: Record<ProfileHeroStyle, string> = {
  card: 'Record card',
  monolith: 'Monolith',
  banner: 'Banner',
};

/**
 * Widgets a player can order and pin on their profile overview. The vocabulary
 * is closed: an unknown id in stored state is dropped on load.
 */
export type ProfileWidgetId =
  | 'archetypes'
  | 'insights'
  | 'heatmap'
  | 'achievements'
  | 'currently-playing'
  | 'recently-finished'
  | 'wishlist'
  | 'backlog'
  | 'collections'
  | 'activity';

export const PROFILE_WIDGET_LABELS: Record<ProfileWidgetId, string> = {
  archetypes: 'Player archetypes',
  insights: 'Gaming insights',
  heatmap: 'Activity heatmap',
  achievements: 'Rarest unlocks',
  'currently-playing': 'Currently playing',
  /** §6's trophy shelf — see `CompletedCase` for why it is not "Platinum". */
  'recently-finished': 'Completed case',
  wishlist: 'Wishlist',
  backlog: 'Backlog',
  collections: 'Collections',
  activity: 'Recent activity',
};

/** Default display order. */
export const DEFAULT_WIDGET_ORDER: readonly ProfileWidgetId[] = [
  'archetypes',
  'currently-playing',
  'insights',
  'achievements',
  'recently-finished',
  'heatmap',
  'collections',
  'wishlist',
  'backlog',
  'activity',
];

export interface ProfileCustomization {
  accent: AccentKey;
  cardStyle: ProfileCardStyle;
  heroStyle: ProfileHeroStyle;
  bannerStyle: ProfileBannerStyle;
  favoritePlatform: string | null;
  consoleGeneration: ConsoleGeneration | null;
  /** Full display order; every known widget appears exactly once. */
  widgetOrder: ProfileWidgetId[];
  /** Pinned widgets float to the top, preserving their relative order. */
  pinnedWidgets: ProfileWidgetId[];
  /** Widgets the player has switched off entirely. */
  hiddenWidgets: ProfileWidgetId[];
}

export const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  accent: 'neutral',
  cardStyle: 'elevated',
  heroStyle: 'card',
  bannerStyle: 'artwork',
  favoritePlatform: null,
  consoleGeneration: null,
  widgetOrder: [...DEFAULT_WIDGET_ORDER],
  pinnedWidgets: [],
  hiddenWidgets: [],
};

function isWidgetId(value: unknown): value is ProfileWidgetId {
  return typeof value === 'string' && value in PROFILE_WIDGET_LABELS;
}

/**
 * Normalize stored state. Unknown widget ids are dropped and newly shipped
 * widgets are appended in their default position, so adding a widget in a later
 * release never leaves an existing player unable to see it.
 */
export function normalizeWidgetOrder(stored: readonly unknown[]): ProfileWidgetId[] {
  const seen = new Set<ProfileWidgetId>();
  const order: ProfileWidgetId[] = [];

  for (const value of stored) {
    if (isWidgetId(value) && !seen.has(value)) {
      seen.add(value);
      order.push(value);
    }
  }

  for (const id of DEFAULT_WIDGET_ORDER) {
    if (!seen.has(id)) {
      order.push(id);
    }
  }

  return order;
}

/** Effective render order: pinned widgets first, hidden widgets removed. */
export function resolveWidgetLayout(customization: ProfileCustomization): ProfileWidgetId[] {
  const hidden = new Set(customization.hiddenWidgets);
  const pinned = new Set(customization.pinnedWidgets);
  const ordered = customization.widgetOrder.filter((id) => !hidden.has(id));

  return [...ordered.filter((id) => pinned.has(id)), ...ordered.filter((id) => !pinned.has(id))];
}

/**
 * Move a widget by one position within the order. Used by the reorder controls;
 * returns the input unchanged when the move would fall off either end.
 */
export function moveWidget(
  order: readonly ProfileWidgetId[],
  id: ProfileWidgetId,
  direction: 'up' | 'down',
): ProfileWidgetId[] {
  const index = order.indexOf(id);
  if (index === -1) {
    return [...order];
  }
  const target = direction === 'up' ? index - 1 : index + 1;

  const next = [...order];
  const moved = next[index];
  const displaced = next[target];
  // Both reads are in range by construction; the guard also satisfies the
  // no-unchecked-indexed-access contract without an assertion.
  if (moved === undefined || displaced === undefined) {
    return next;
  }

  next[index] = displaced;
  next[target] = moved;
  return next;
}

/** Move a widget to an arbitrary index — the drag-and-drop drop handler. */
export function reorderWidget(
  order: readonly ProfileWidgetId[],
  id: ProfileWidgetId,
  toIndex: number,
): ProfileWidgetId[] {
  const index = order.indexOf(id);
  if (index === -1) {
    return [...order];
  }
  const clamped = Math.max(0, Math.min(order.length - 1, toIndex));
  if (clamped === index) {
    return [...order];
  }

  const next = [...order];
  next.splice(index, 1);
  next.splice(clamped, 0, id);
  return next;
}

export function toggleInList<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * Parse persisted JSON back into customization state. Anything malformed falls
 * back to the default for that field rather than throwing — a corrupt
 * preferences blob must never block the profile from rendering.
 */
export function parseCustomization(raw: string | null): ProfileCustomization {
  if (raw === null || raw.length === 0) {
    return { ...DEFAULT_CUSTOMIZATION, widgetOrder: [...DEFAULT_WIDGET_ORDER] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_CUSTOMIZATION, widgetOrder: [...DEFAULT_WIDGET_ORDER] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ...DEFAULT_CUSTOMIZATION, widgetOrder: [...DEFAULT_WIDGET_ORDER] };
  }

  const record = parsed as Record<string, unknown>;

  const accent =
    typeof record.accent === 'string' ? (record.accent as AccentKey) : DEFAULT_CUSTOMIZATION.accent;
  const cardStyle =
    record.cardStyle === 'flat' ||
    record.cardStyle === 'outlined' ||
    record.cardStyle === 'elevated'
      ? record.cardStyle
      : DEFAULT_CUSTOMIZATION.cardStyle;
  const bannerStyle =
    record.bannerStyle === 'gradient' ||
    record.bannerStyle === 'solid' ||
    record.bannerStyle === 'artwork'
      ? record.bannerStyle
      : DEFAULT_CUSTOMIZATION.bannerStyle;

  // Absent in blobs written before §6 shipped the card, so an existing player
  // lands on the new default rather than on a variant they never chose.
  const heroStyle =
    record.heroStyle === 'monolith' || record.heroStyle === 'banner' || record.heroStyle === 'card'
      ? record.heroStyle
      : DEFAULT_CUSTOMIZATION.heroStyle;

  const consoleGeneration =
    typeof record.consoleGeneration === 'string' &&
    record.consoleGeneration in CONSOLE_GENERATION_LABELS
      ? (record.consoleGeneration as ConsoleGeneration)
      : null;

  return {
    accent,
    cardStyle,
    heroStyle,
    bannerStyle,
    favoritePlatform:
      typeof record.favoritePlatform === 'string' && record.favoritePlatform.length > 0
        ? record.favoritePlatform
        : null,
    consoleGeneration,
    widgetOrder: normalizeWidgetOrder(Array.isArray(record.widgetOrder) ? record.widgetOrder : []),
    pinnedWidgets: Array.isArray(record.pinnedWidgets)
      ? record.pinnedWidgets.filter(isWidgetId)
      : [],
    hiddenWidgets: Array.isArray(record.hiddenWidgets)
      ? record.hiddenWidgets.filter(isWidgetId)
      : [],
  };
}

export function serializeCustomization(customization: ProfileCustomization): string {
  return JSON.stringify(customization);
}
