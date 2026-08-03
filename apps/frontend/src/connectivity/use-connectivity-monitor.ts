import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { getLogger } from '../logging/logger';
import { useConnectivityStore } from '../state/stores';

import { probeApiReachability } from './api-reachability';

/** Minimum time between reachability probes — OFFLINE_MODE.md's 10s debounce. */
const PROBE_DEBOUNCE_MS = 10_000;

/**
 * Subscribes to online/offline detection and reconnect signals (D3.15).
 *
 * NetInfo's `isConnected` — a real interface state — is trusted directly: no
 * network adapter means no reachability, full stop. Its `isInternetReachable`
 * is not trusted as the verdict, only as a signal that a probe is worth
 * running: that flag comes from a ping against a public endpoint, so it goes
 * false in any environment where the API is on localhost or a private
 * network the public probe can't see, which is every local dev environment.
 * The verdict comes from probing our own API base URL instead.
 */
export function useConnectivityMonitor(): void {
  const setOnline = useConnectivityStore((s) => s.setOnline);

  useEffect(() => {
    let previousOnline = useConnectivityStore.getState().isOnline;
    let lastProbeAt = 0;

    const resolve = async (hasInterface: boolean, type: string): Promise<void> => {
      const online = hasInterface && (await probeApiReachability());
      if (online !== previousOnline) {
        getLogger().info(online ? 'network reconnect' : 'network offline', { type });
        previousOnline = online;
      }
      setOnline(online);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const hasInterface = state.isConnected !== false;
      if (!hasInterface) {
        void resolve(false, state.type);
        return;
      }
      const now = Date.now();
      if (now - lastProbeAt < PROBE_DEBOUNCE_MS) {
        return;
      }
      lastProbeAt = now;
      void resolve(true, state.type);
    });

    lastProbeAt = Date.now();
    void NetInfo.fetch().then((state) => {
      void resolve(state.isConnected !== false, state.type);
    });

    return unsubscribe;
  }, [setOnline]);
}
