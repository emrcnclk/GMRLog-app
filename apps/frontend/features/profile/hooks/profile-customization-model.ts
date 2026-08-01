import type { AccentKey } from '@gmrlog/ui';

/**
 * D3.27 Phase 5 — Profile customization model.
 *
 * **Storage scope:** device-local. GMRLOG has no customization columns and the
 * backend is under FEATURE FREEZE (CHANGELOG "Known limitations"), so these
 * preferences persist through AsyncStorage rather than syncing across devices.
 * The shape below is deliberately the shape a future `GET/PATCH /me/profile-theme`
 * would return, so wiring it to the server later is a swap of the persistence
 * adapter, not a redesign. See `docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md`.
 *
 * Covered by `profile-customization-model.spec.ts`.
 */

/** Card treatment for profile surfaces. */
export type ProfileCardStyle = 'elevated' | 'flat' | 'outlined';

/** Banner treatment behind the profile hero. */
export type ProfileBannerStyle = 'artwork' | 'gradient' | 'solid';

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
  achievements: 'Achievements',
  'currently-playing': 'Currently playing',
  'recently-finished': 'Recently finished',
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

  const consoleGeneration =
    typeof record.consoleGeneration === 'string' &&
    record.consoleGeneration in CONSOLE_GENERATION_LABELS
      ? (record.consoleGeneration as ConsoleGeneration)
      : null;

  return {
    accent,
    cardStyle,
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
