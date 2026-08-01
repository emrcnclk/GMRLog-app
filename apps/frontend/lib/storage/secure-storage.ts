/**
 * Secure storage abstraction (D1.4). Session material stored on the client is
 * capability, not Trust source (F6.7 §8) — the platform stays authoritative.
 * Persistence strategy beyond this interface is intentionally undefined.
 */
export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** Non-persistent adapter — used in tests and as a safe fallback. */
export function createInMemorySecureStorage(): SecureStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => Promise.resolve(store.get(key) ?? null),
    setItem: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}
