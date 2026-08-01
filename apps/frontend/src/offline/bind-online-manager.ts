import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/**
 * Bind TanStack Query onlineManager to NetInfo (D3.15).
 * Call once at app bootstrap before PersistQueryClientProvider mounts children that mutate.
 */
export function bindQueryOnlineManager(): () => void {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setOnline(online);
    });
  });

  return () => {
    onlineManager.setEventListener(() => () => undefined);
  };
}
