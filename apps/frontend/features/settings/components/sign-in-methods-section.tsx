import type { OAuthProviderKind } from '@gmrlog/types';
import { Badge, Button, ErrorBanner, Text, useTheme } from '@gmrlog/ui';
import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog } from '../../content/components/confirm-dialog';
import { useConnectProvider } from '../hooks/use-connect-provider';
import { useDisconnectProvider } from '../hooks/use-disconnect-provider';
import { useSignInMethods } from '../hooks/use-sign-in-methods';
import { mapSettingsError } from '../model/settings-model';
import { canDisconnect, providerDisplayLabel } from '../model/sign-in-methods-model';

import { SetPasswordDialog } from './set-password-dialog';
import { SettingsEmptyState } from './settings-empty-state';
import { SettingsErrorState } from './settings-error-state';
import { SettingsSectionHeader } from './settings-section-header';
import { SettingsSkeleton } from './settings-skeleton';
import { SignInMethodRow } from './sign-in-method-row';

const PROVIDERS: readonly OAuthProviderKind[] = ['google', 'discord'];

/**
 * Task 4.7 — Settings connect/disconnect surface for password, Google and
 * Discord (OAUTH.md §5). Steam stays out of this section entirely: it's
 * connect-only and never counts toward the last-sign-in-method guard
 * (`OAuthService.disconnectLogin`), so it keeps living in "Connected
 * accounts" below, unchanged.
 */
export function SignInMethodsSection() {
  const theme = useTheme();
  const methods = useSignInMethods();
  const connectAction = useConnectProvider();
  const disconnectAction = useDisconnectProvider();
  const [confirmProvider, setConfirmProvider] = useState<OAuthProviderKind | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <>
      <SettingsSectionHeader title="Sign-in methods" description="GET /auth/sign-in-methods" />
      {methods.status === 'loading' ? <SettingsSkeleton /> : null}
      {methods.status === 'error' ? (
        <SettingsErrorState
          title={mapSettingsError(methods.error, true).title}
          description={mapSettingsError(methods.error, true).description}
          isOffline={false}
          onRetry={() => {
            void methods.refetch();
          }}
        />
      ) : null}
      {methods.status === 'ready' && methods.methods === null ? (
        <SettingsEmptyState title="No sign-in methods" description="Something went wrong." />
      ) : null}
      {methods.status === 'ready' && methods.methods !== null
        ? (() => {
            const data = methods.methods;
            return (
              <>
                <View
                  style={{
                    paddingHorizontal: theme.space('space.4'),
                    paddingVertical: theme.space('space.3'),
                    gap: theme.space('space.2'),
                    borderBottomWidth: 1,
                    borderBottomColor: theme.color('color.border.default'),
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.space('space.2'),
                    }}
                  >
                    <Text role="title" color="color.text.primary" style={{ flex: 1 }}>
                      Password
                    </Text>
                    <Badge tone={data.password.usable ? 'success' : 'neutral'}>
                      {data.password.usable ? 'Set' : 'Not set'}
                    </Badge>
                  </View>
                  {!data.password.usable ? (
                    <Button
                      variant="secondary"
                      accessibilityLabel="Set a password"
                      onPress={() => {
                        setPasswordDialogOpen(true);
                      }}
                    >
                      Set password
                    </Button>
                  ) : null}
                </View>

                {PROVIDERS.map((provider) => (
                  <SignInMethodRow
                    key={provider}
                    provider={provider}
                    connected={
                      provider === 'google' ? data.google.connected : data.discord.connected
                    }
                    canDisconnect={canDisconnect(data, provider)}
                    connectPending={connectAction.pending}
                    disconnectPending={disconnectAction.busyProvider === provider}
                    onConnect={() => {
                      void connectAction.connect(provider);
                    }}
                    onDisconnect={() => {
                      setConfirmProvider(provider);
                    }}
                  />
                ))}
              </>
            );
          })()
        : null}

      {connectAction.error ? (
        <View
          style={{ paddingHorizontal: theme.space('space.4'), paddingTop: theme.space('space.2') }}
        >
          <ErrorBanner
            title={connectAction.error.title}
            description={connectAction.error.description}
          />
        </View>
      ) : null}
      {disconnectAction.error ? (
        <View
          style={{ paddingHorizontal: theme.space('space.4'), paddingTop: theme.space('space.2') }}
        >
          <ErrorBanner
            title={disconnectAction.error.title}
            description={disconnectAction.error.description}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmProvider !== null}
        title={confirmProvider ? `Disconnect ${providerDisplayLabel(confirmProvider)}?` : ''}
        description="You can reconnect it at any time."
        confirmLabel="Disconnect"
        danger
        onCancel={() => {
          setConfirmProvider(null);
        }}
        onConfirm={() => {
          if (confirmProvider !== null) {
            void disconnectAction.disconnect(confirmProvider);
          }
          setConfirmProvider(null);
        }}
      />

      <SetPasswordDialog
        visible={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false);
        }}
      />
    </>
  );
}
