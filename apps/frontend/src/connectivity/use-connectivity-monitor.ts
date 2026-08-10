import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { getLogger } from '../logging/logger';
import { useConnectivityStore } from '../state/stores';

import { probeApiReachability } from './api-reachability';

/** Minimum time between reachability probes — OFFLINE_MODE.md's 10s debounce. */
const PROBE_DEBOUNCE_MS = 10_000;

/**
 * How often to re-probe while marked offline (3b.1c).
 *
 * NetInfo only fires on an interface change — a dead API with the network
 * adapter still up is not one, so without this the store latches offline
 * indefinitely once wrong (or once the API genuinely goes down) and only a
 * full reload clears it, because nothing else ever asks again.
 */
const RECONNECT_POLL_MS = 8_000;

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

    // Self-correct without a reload: only ticks while offline, and stops
    // costing anything the moment a probe (from here or a NetInfo event)
    // flips the store back online.
    const pollInterval = setInterval(() => {
      if (!useConnectivityStore.getState().isOnline) {
        lastProbeAt = Date.now();
        void resolve(true, 'poll');
      }
    }, RECONNECT_POLL_MS);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [setOnline]);
}
