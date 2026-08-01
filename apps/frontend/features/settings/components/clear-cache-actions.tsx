import { Button, Text, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { useStorageActions } from '../hooks/use-diagnostics';
import { clearCacheLabel } from '../model/storage-model';

function ClearCacheActionsComponent() {
  const theme = useTheme();
  const actions = useStorageActions();
  const [pendingKind, setPendingKind] = useState<'image' | 'query' | 'app' | null>(null);

  return (
    <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
      {actions.message ? (
        <Text role="caption" color="color.text.secondary">
          {actions.message}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        accessibilityLabel={clearCacheLabel('image')}
        disabled={actions.busy}
        loading={actions.busy && pendingKind === 'image'}
        onPress={() => {
          setPendingKind('image');
        }}
      >
        {clearCacheLabel('image')}
      </Button>
      <Button
        variant="secondary"
        accessibilityLabel={clearCacheLabel('query')}
        disabled={actions.busy}
        loading={actions.busy && pendingKind === 'query'}
        onPress={() => {
          setPendingKind('query');
        }}
      >
        {clearCacheLabel('query')}
      </Button>
      <Button
        variant="secondary"
        accessibilityLabel={clearCacheLabel('app')}
        disabled={actions.busy}
        loading={actions.busy && pendingKind === 'app'}
        onPress={() => {
          setPendingKind('app');
        }}
      >
        {clearCacheLabel('app')}
      </Button>
      <Text role="caption" color="color.text.tertiary">
        Clearing app cache does not delete SecureStore session tokens.
      </Text>

      <ConfirmDialog
        visible={pendingKind !== null}
        title={pendingKind ? clearCacheLabel(pendingKind) : 'Clear cache'}
        description="This removes local caches. You may need to reload content."
        confirmLabel="Clear"
        danger
        onCancel={() => {
          setPendingKind(null);
        }}
        onConfirm={() => {
          const kind = pendingKind;
          setPendingKind(null);
          if (!kind) {
            return;
          }
          void (async () => {
            if (kind === 'image') {
              await actions.clearImage();
            } else if (kind === 'query') {
              await actions.clearQuery();
            } else {
              await actions.clearApp();
            }
          })();
        }}
      />
    </View>
  );
}

export const ClearCacheActions = memo(ClearCacheActionsComponent);
