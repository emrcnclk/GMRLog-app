import type { SecureStorage } from '../../../lib/storage/secure-storage';

export const RECENT_SEARCHES_KEY = 'gmrlog.search.recent';
export const RECENT_SEARCHES_MAX = 10;

/** Newest-first recent query list — max 10 · duplicates move to top. */
export function upsertRecentSearch(existing: string[], query: string): string[] {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return existing;
  }
  const without = existing.filter((item) => item.toLowerCase() !== normalized.toLowerCase());
  return [normalized, ...without].slice(0, RECENT_SEARCHES_MAX);
}

export function removeRecentSearch(existing: string[], query: string): string[] {
  return existing.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
}

export async function loadRecentSearches(storage: SecureStorage): Promise<string[]> {
  const raw = await storage.getItem(RECENT_SEARCHES_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, RECENT_SEARCHES_MAX);
  } catch {
    return [];
  }
}

export async function saveRecentSearches(storage: SecureStorage, queries: string[]): Promise<void> {
  await storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(queries.slice(0, RECENT_SEARCHES_MAX)));
}
