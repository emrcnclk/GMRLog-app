import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async () => null,
    setItem: async () => undefined,
    removeItem: async () => undefined,
  },
}));

import { useConnectivityStore } from '../state/stores';

import { runOrEnqueueOffline, runOrEnqueueOfflineResult } from './run-or-enqueue';

describe('runOrEnqueueOffline branch reporting', () => {
  it('reports "online" and runs the API call when connected', async () => {
    useConnectivityStore.setState({ isOnline: true });
    const onlineFn = vi.fn(async () => undefined);

    const branch = await runOrEnqueueOffline('event.join', { eventId: 'evt_1' }, onlineFn);

    expect(branch).toBe('online');
    expect(onlineFn).toHaveBeenCalledTimes(1);
  });

  it('reports "offline" and enqueues instead of calling the API when disconnected', async () => {
    useConnectivityStore.setState({ isOnline: false });
    const onlineFn = vi.fn(async () => undefined);

    const branch = await runOrEnqueueOffline('event.join', { eventId: 'evt_1' }, onlineFn);

    expect(branch).toBe('offline');
    expect(onlineFn).not.toHaveBeenCalled();

    useConnectivityStore.setState({ isOnline: true });
  });
});

describe('runOrEnqueueOfflineResult branch reporting', () => {
  it('returns the online value tagged "online"', async () => {
    useConnectivityStore.setState({ isOnline: true });

    const result = await runOrEnqueueOfflineResult(
      'settings.appearance',
      { theme: 'light' },
      async () => ({ theme: 'light' }),
      () => ({ theme: 'dark' }),
    );

    expect(result).toEqual({ value: { theme: 'light' }, branch: 'online' });
  });

  it('returns the offline fallback tagged "offline" without calling onlineFn', async () => {
    useConnectivityStore.setState({ isOnline: false });
    const onlineFn = vi.fn(async () => ({ theme: 'light' }));

    const result = await runOrEnqueueOfflineResult(
      'settings.appearance',
      { theme: 'light' },
      onlineFn,
      () => ({ theme: 'dark' }),
    );

    expect(result).toEqual({ value: { theme: 'dark' }, branch: 'offline' });
    expect(onlineFn).not.toHaveBeenCalled();

    useConnectivityStore.setState({ isOnline: true });
  });
});
