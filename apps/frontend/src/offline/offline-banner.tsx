import { ErrorBanner, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useConnectivityStore } from '../state/stores';

/**
 * Global offline / syncing banner — never blanks the tree (D3.15).
 * Cached screens remain interactive underneath.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const isSyncing = useConnectivityStore((s) => s.isSyncing);
  const pendingMutations = useConnectivityStore((s) => s.pendingMutations);

  if (isOnline && !isSyncing && pendingMutations === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <View
        style={{
          paddingTop: insets.top > 0 ? 0 : theme.space('space.2'),
          paddingHorizontal: theme.space('space.3'),
          paddingBottom: theme.space('space.2'),
          backgroundColor: theme.color('color.surface.primary'),
        }}
        accessibilityLiveRegion="polite"
      >
        <ErrorBanner
          title="You are offline"
          description={
            pendingMutations > 0
              ? `${String(pendingMutations)} change${pendingMutations === 1 ? '' : 's'} will sync when you reconnect. Cached content may still be available.`
              : 'Cached content may still be available. Changes that support offline will sync when you reconnect.'
          }
        />
      </View>
    );
  }

  if (isSyncing || pendingMutations > 0) {
    return (
      <View
        style={{
          paddingHorizontal: theme.space('space.3'),
          paddingBottom: theme.space('space.2'),
          backgroundColor: theme.color('color.surface.primary'),
        }}
        accessibilityLiveRegion="polite"
      >
        <Text role="caption" color="color.text.secondary">
          {isSyncing
            ? 'Syncing offline changes…'
            : `${String(pendingMutations)} pending offline change(s)`}
        </Text>
      </View>
    );
  }

  return null;
}
