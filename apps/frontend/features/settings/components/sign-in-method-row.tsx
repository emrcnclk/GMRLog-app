import type { OAuthProviderKind } from '@gmrlog/types';
import { Badge, Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { providerDisplayLabel } from '../model/sign-in-methods-model';

export interface SignInMethodRowProps {
  provider: OAuthProviderKind;
  connected: boolean;
  canDisconnect: boolean;
  connectPending: boolean;
  disconnectPending: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

/** Task 4.7 — one Google/Discord row on the Settings sign-in-methods surface. */
function SignInMethodRowComponent({
  provider,
  connected,
  canDisconnect,
  connectPending,
  disconnectPending,
  onConnect,
  onDisconnect,
}: SignInMethodRowProps) {
  const theme = useTheme();
  const label = providerDisplayLabel(provider);

  return (
    <View
      accessibilityLabel={`${label} ${connected ? 'connected' : 'not connected'}`}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
        <Text role="title" color="color.text.primary" style={{ flex: 1 }}>
          {label}
        </Text>
        <Badge tone={connected ? 'success' : 'neutral'}>
          {connected ? 'Connected' : 'Not connected'}
        </Badge>
      </View>
      {connected ? (
        <Button
          variant="secondary"
          accessibilityLabel={`Disconnect ${label}`}
          loading={disconnectPending}
          disabled={disconnectPending || !canDisconnect}
          onPress={onDisconnect}
        >
          Disconnect
        </Button>
      ) : (
        <Button
          variant="secondary"
          accessibilityLabel={`Connect ${label}`}
          loading={connectPending}
          disabled={connectPending}
          onPress={onConnect}
        >
          Connect
        </Button>
      )}
      {connected && !canDisconnect ? (
        <Text role="caption" color="color.text.tertiary">
          Your only sign-in method. Set a password or connect another provider first.
        </Text>
      ) : null}
    </View>
  );
}

export const SignInMethodRow = memo(SignInMethodRowComponent);
