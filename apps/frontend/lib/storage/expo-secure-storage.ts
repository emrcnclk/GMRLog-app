import { Platform } from 'react-native';

import type { SecureStorage } from './secure-storage';

/**
 * Web-safe secure storage.
 * Expo SDK 52 expects expo-secure-store ~14; mismatched majors break web
 * (`getValueWithKeyAsync is not a function`) and hang auth bootstrap.
 */
/** Returns null on native and when storage access itself throws (blocked cookies). */
function readLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function createWebLocalSecureStorage(): SecureStorage {
  const prefix = 'gmrlog.secure.';
  return {
    getItem: (key) => {
      try {
        return Promise.resolve(readLocalStorage()?.getItem(`${prefix}${key}`) ?? null);
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem: (key, value) => {
      try {
        readLocalStorage()?.setItem(`${prefix}${key}`, value);
      } catch {
        // ignore quota / private mode
      }
      return Promise.resolve();
    },
    removeItem: (key) => {
      try {
        readLocalStorage()?.removeItem(`${prefix}${key}`);
      } catch {
        // ignore
      }
      return Promise.resolve();
    },
  };
}

/** Expo Secure Store adapter (native) with web localStorage fallback. */
export function createExpoSecureStorage(): SecureStorage {
  if (Platform.OS === 'web') {
    return createWebLocalSecureStorage();
  }

  // Lazy require so web never loads a broken SecureStore module path.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  if (typeof SecureStore.getItemAsync !== 'function') {
    return createWebLocalSecureStorage();
  }

  return {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: async (key, value) => {
      await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key) => {
      await SecureStore.deleteItemAsync(key);
    },
  };
}
