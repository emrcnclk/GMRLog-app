import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { getLogger } from '../logging/logger';
import { useConnectivityStore } from '../state/stores';

/** Subscribes to online/offline detection and reconnect signals (D3.15). */
export function useConnectivityMonitor(): void {
  const setOnline = useConnectivityStore((s) => s.setOnline);

  useEffect(() => {
    let previousOnline = useConnectivityStore.getState().isOnline;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      if (online !== previousOnline) {
        getLogger().info(online ? 'network reconnect' : 'network offline', {
          type: state.type,
        });
        previousOnline = online;
      }
      setOnline(online);
    });

    void NetInfo.fetch().then((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      previousOnline = online;
      setOnline(online);
    });

    return unsubscribe;
  }, [setOnline]);
}
