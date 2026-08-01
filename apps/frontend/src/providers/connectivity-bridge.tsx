import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useConnectivityMonitor } from '../connectivity/use-connectivity-monitor';
import { OfflineBanner, OfflineRecoveryBridge } from '../offline';

/** Connectivity monitor + offline banner + reconnect flush (D3.15). */
export function ConnectivityBridge({ children }: { children: ReactNode }) {
  useConnectivityMonitor();
  return (
    <OfflineRecoveryBridge>
      <View style={{ flex: 1 }}>
        <OfflineBanner />
        {children}
      </View>
    </OfflineRecoveryBridge>
  );
}
