import { onlineManager } from '@tanstack/react-query';

import { useConnectivityStore } from '../state/stores';

/**
 * Bind TanStack Query onlineManager to our own connectivity verdict (D3.15).
 *
 * Reads `useConnectivityStore` rather than deriving a second verdict from
 * NetInfo directly — `useConnectivityMonitor` already judges reachability
 * against our own API base URL rather than NetInfo's `isInternetReachable`
 * (see use-connectivity-monitor.ts), and Query pausing must agree with the
 * offline mutation queue on what "online" means or the two disagree about
 * whether a request should even be attempted.
 *
 * Call once at app bootstrap before PersistQueryClientProvider mounts children that mutate.
 */
export function bindQueryOnlineManager(): () => void {
  onlineManager.setEventListener((setOnline) => {
    setOnline(useConnectivityStore.getState().isOnline);
    return useConnectivityStore.subscribe((state) => {
      setOnline(state.isOnline);
    });
  });

  return () => {
    onlineManager.setEventListener(() => () => undefined);
  };
}
