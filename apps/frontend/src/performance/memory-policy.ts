/**
 * Memory pressure helpers (D3.15) — apply where beneficial; no invented product behavior.
 */

/** Query domains that should not linger in memory after leaving the screen. */
export const EPHEMERAL_QUERY_ROOTS = ['search', 'health'] as const;

/** Suggested image decode / cache budget notes for audits (expo-image). */
export const IMAGE_MEMORY_POLICY = {
  /** Prefer disk+memory for avatars and covers already using CachedImage. */
  cachePolicy: 'memory-disk' as const,
  /** Avoid decoding full-bleed assets larger than viewport without size hints. */
  preferSizedSources: true,
} as const;

/** Navigation stack memory — keep inactive screens detached when possible. */
export const NAVIGATION_MEMORY = {
  detachInactiveScreens: true,
} as const;

/** Cap in-memory infinite query pages retained after hydrate (soft guidance). */
export const INFINITE_QUERY_PAGE_SOFT_CAP = 3;
