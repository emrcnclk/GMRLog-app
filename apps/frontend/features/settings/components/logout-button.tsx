import { Button, ErrorBanner, useTheme } from '@gmrlog/ui';
import { memo, useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { useLogoutAction } from '../hooks/use-logout';

function LogoutButtonComponent() {
  const theme = useTheme();
  const logout = useLogoutAction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
      {logout.error ? (
        <ErrorBanner title={logout.error.title} description={logout.error.description} />
      ) : null}
      <Button
        variant="secondary"
        accessibilityLabel="Log out"
        loading={logout.busy}
        disabled={logout.busy}
        onPress={() => {
          setConfirmOpen(true);
        }}
      >
        Log out
      </Button>
      <ConfirmDialog
        visible={confirmOpen}
        title="Log out?"
        description="You will need to sign in again to continue."
        confirmLabel="Log out"
        danger
        onCancel={() => {
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          void logout.run();
        }}
      />
    </View>
  );
}

export const LogoutButton = memo(LogoutButtonComponent);
