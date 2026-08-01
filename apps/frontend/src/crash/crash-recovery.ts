import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLogger } from '../logging/logger';
import { QUERY_CACHE_STORAGE_KEY } from '../offline/cache-version';
import { safeReadPersistedClient } from '../offline/query-persister';

export interface CrashRecoveryResult {
  queryCacheRestored: boolean;
  queryCacheCleared: boolean;
  authExpectedFromSecureStore: true;
}

/**
 * Production-safe crash recovery bootstrap (D3.15).
 * - Never restores corrupted query cache
 * - Auth remains SecureStore-owned (SessionManager bootstrap)
 * - Navigation recovery is Expo Router default (no invented deep-link rewrite)
 */
export async function runCrashRecovery(): Promise<CrashRecoveryResult> {
  const logger = getLogger();
  try {
    const restored = await safeReadPersistedClient(QUERY_CACHE_STORAGE_KEY);
    if (restored === undefined) {
      logger.info('crash recovery: no durable query cache (or cleared)');
      return {
        queryCacheRestored: false,
        queryCacheCleared: true,
        authExpectedFromSecureStore: true,
      };
    }
    logger.info('crash recovery: durable query cache present for hydration');
    return {
      queryCacheRestored: true,
      queryCacheCleared: false,
      authExpectedFromSecureStore: true,
    };
  } catch (error) {
    logger.warn('crash recovery failed — clearing query cache', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    try {
      await AsyncStorage.removeItem(QUERY_CACHE_STORAGE_KEY);
    } catch {
      // ignore
    }
    return {
      queryCacheRestored: false,
      queryCacheCleared: true,
      authExpectedFromSecureStore: true,
    };
  }
}
