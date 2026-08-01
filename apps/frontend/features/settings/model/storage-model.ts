export type ClearCacheKind = 'image' | 'query' | 'app';

export interface StorageInfoSnapshot {
  imageCacheLabel: string;
  queryCacheLabel: string;
  secureStoreLabel: string;
  queryEntryCount: number;
}

export function clearCacheLabel(kind: ClearCacheKind): string {
  switch (kind) {
    case 'image':
      return 'Clear image cache';
    case 'query':
      return 'Clear query cache';
    case 'app':
      return 'Clear app cache';
  }
}

export function formatQueryCacheLabel(entryCount: number): string {
  return `${String(entryCount)} React Query entries in memory`;
}

export function formatImageCacheLabel(known = false): string {
  return known
    ? 'expo-image disk + memory cache'
    : 'expo-image disk + memory cache (size not reported)';
}

export function formatSecureStoreLabel(): string {
  return 'Session tokens in SecureStore (gmrlog.session.*) — not cleared by cache actions';
}

export function buildStorageInfo(queryEntryCount: number): StorageInfoSnapshot {
  return {
    imageCacheLabel: formatImageCacheLabel(),
    queryCacheLabel: formatQueryCacheLabel(queryEntryCount),
    secureStoreLabel: formatSecureStoreLabel(),
    queryEntryCount,
  };
}
