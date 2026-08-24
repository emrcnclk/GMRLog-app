import { Button, ErrorBanner, Text, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { useConnectivityStore } from '../../../src/state/stores';
import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { useAccountDeletion } from '../hooks/use-account-deletion';

import { SettingsErrorState } from './settings-error-state';
import { SettingsSkeleton } from './settings-skeleton';

/**
 * 12.6 — replaces `DeleteAccountPlaceholder` now that `/me/account/deletion`
 * is real. Never deletes a state: loading (skeleton), error (retry) and the
 * two ready states — nothing pending, or a grace period counting down — all
 * exist here rather than only the happy path.
 */
function AccountDeletionRowComponent() {
  const theme = useTheme();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const deletion = useAccountDeletion();
  const [confirming, setConfirming] = useState<'delete' | 'cancel' | null>(null);

  if (deletion.status === 'loading') {
    return <SettingsSkeleton />;
  }

  if (deletion.status === 'error') {
    return (
      <SettingsErrorState
        title={deletion.error?.title}
        description={deletion.error?.description}
        isOffline={!isOnline}
        onRetry={() => {
          void deletion.refresh();
        }}
      />
    );
  }

  const pending = deletion.deletion?.pending === true;
  const deletesAt = deletion.deletion?.deletesAt;

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
      }}
    >
      <Text role="title" color="color.text.primary">
        Delete account
      </Text>

      {pending && deletesAt ? (
        <>
          <Text role="body" color="color.text.secondary">
            Your account is scheduled for deletion. You can still cancel — after that it is
            permanent.
          </Text>
          <Text role="meta" color="color.text.tertiary">
            DELETES ON {new Date(deletesAt).toLocaleDateString()}
          </Text>
        </>
      ) : (
        // A sentence, so `body` — the same call the pending branch above already
        // makes, and the one the export row's own comment spells out. `meta`
        // set it in monospace uppercase, which reads as a system stamp rather
        // than as the plainest warning on the screen.
        <Text role="body" color="color.text.secondary">
          Starts a 30-day grace period. You can cancel any time before it ends; after that, deletion
          is permanent.
        </Text>
      )}

      {deletion.error ? (
        <ErrorBanner title={deletion.error.title} description={deletion.error.description} />
      ) : null}

      <Button
        variant={pending ? 'secondary' : 'danger'}
        accessibilityLabel={pending ? 'Cancel deletion' : 'Delete account'}
        loading={deletion.busy}
        disabled={deletion.busy}
        onPress={() => {
          setConfirming(pending ? 'cancel' : 'delete');
        }}
      >
        {pending ? 'Cancel deletion' : 'Delete account'}
      </Button>

      <ConfirmDialog
        visible={confirming !== null}
        title={confirming === 'cancel' ? 'Cancel deletion?' : 'Delete your account?'}
        description={
          confirming === 'cancel'
            ? 'Your account will no longer be scheduled for deletion.'
            : 'This starts a 30-day grace period. You can cancel any time before it ends; after that, your account and its personal data are permanently erased.'
        }
        confirmLabel={confirming === 'cancel' ? 'Cancel deletion' : 'Delete account'}
        danger={confirming !== 'cancel'}
        loading={deletion.busy}
        onCancel={() => {
          setConfirming(null);
        }}
        onConfirm={() => {
          const action = confirming;
          setConfirming(null);
          void (action === 'cancel' ? deletion.cancelDeletion() : deletion.requestDeletion());
        }}
      />
    </View>
  );
}

export const AccountDeletionRow = memo(AccountDeletionRowComponent);
