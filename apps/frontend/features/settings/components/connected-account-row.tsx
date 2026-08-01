import type { ConnectedAccountResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { connectedAccountStatusLabel, providerLabel } from '../model/account-model';

export interface ConnectedAccountRowProps {
  account: ConnectedAccountResponse;
}

function ConnectedAccountRowComponent({ account }: ConnectedAccountRowProps) {
  const theme = useTheme();
  const tone =
    account.status === 'connected'
      ? 'success'
      : account.status === 'expired'
        ? 'warning'
        : 'neutral';

  return (
    <View
      accessibilityLabel={`${providerLabel(account.provider)} ${connectedAccountStatusLabel(account.status)}`}
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
          {providerLabel(account.provider)}
        </Text>
        <Badge tone={tone}>{connectedAccountStatusLabel(account.status)}</Badge>
      </View>
      {account.linkedAt ? (
        <Text role="meta" color="color.text.tertiary">
          Linked {new Date(account.linkedAt).toLocaleDateString()}
        </Text>
      ) : null}
      {account.scopes.length > 0 ? (
        <Text role="caption" color="color.text.tertiary">
          Scopes: {account.scopes.join(', ')}
        </Text>
      ) : null}
    </View>
  );
}

export const ConnectedAccountRow = memo(ConnectedAccountRowComponent);
