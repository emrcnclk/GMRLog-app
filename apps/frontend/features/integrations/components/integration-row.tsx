import type { UserIntegrationResponse } from '@gmrlog/types';
import { Badge, Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import {
  canSyncIntegration,
  formatLastSyncAt,
  integrationProviderLabel,
} from '../hooks/integrations-model';
import { useSyncIntegration } from '../hooks/use-integrations';

export interface IntegrationRowProps {
  integration: UserIntegrationResponse;
  disabled?: boolean;
}

function IntegrationRowComponent({ integration, disabled = false }: IntegrationRowProps) {
  const theme = useTheme();
  const sync = useSyncIntegration();
  const canSync = canSyncIntegration(integration);
  const tone =
    integration.status === 'connected' || integration.status === 'active'
      ? 'success'
      : integration.status === 'error' || integration.status === 'failed'
        ? 'danger'
        : 'neutral';
  // Task 4.5a — self-reported Steam connections carry no proof of
  // ownership; say so wherever the connection is shown, not only at
  // connect time.
  const isUnverifiedSteam = integration.provider === 'steam' && integration.verified === false;

  return (
    <View
      accessibilityLabel={`${integrationProviderLabel(integration.provider)} ${integration.status}`}
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
          {integration.displayName ?? integrationProviderLabel(integration.provider)}
        </Text>
        <Badge tone={tone}>{integration.status}</Badge>
      </View>
      <Text role="meta" color="color.text.tertiary">
        {integrationProviderLabel(integration.provider)} ·{' '}
        {formatLastSyncAt(integration.lastSyncAt)}
        {isUnverifiedSteam ? ' · Unverified' : ''}
      </Text>
      <Text role="caption" color="color.text.secondary">
        {String(integration.gamesImported)} games · {String(integration.achievementsSynced)}{' '}
        achievements
      </Text>
      {canSync ? (
        <Button
          size="sm"
          variant="secondary"
          accessibilityLabel={`Sync ${integrationProviderLabel(integration.provider)}`}
          disabled={sync.isPending || disabled}
          loading={sync.isPending}
          onPress={() => {
            sync.mutate(integration.id);
          }}
        >
          Sync now
        </Button>
      ) : null}
    </View>
  );
}

export const IntegrationRow = memo(IntegrationRowComponent);
