import type { SyncHistoryResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import {
  formatSyncCounts,
  formatSyncDuration,
  integrationProviderLabel,
  syncJobStatusLabel,
  syncJobStatusTone,
} from '../hooks/integrations-model';

export interface SyncHistoryListProps {
  items: SyncHistoryResponse[];
}

function SyncHistoryRow({ item }: { item: SyncHistoryResponse }) {
  const theme = useTheme();
  const duration = formatSyncDuration(item.durationMs);

  return (
    <View
      accessibilityLabel={`${integrationProviderLabel(item.provider)} sync ${syncJobStatusLabel(item.status)}`}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.1'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
        <Text role="title" color="color.text.primary" style={{ flex: 1 }}>
          {integrationProviderLabel(item.provider)}
        </Text>
        <Badge tone={syncJobStatusTone(item.status)}>{syncJobStatusLabel(item.status)}</Badge>
      </View>
      <Text role="meta" color="color.text.tertiary">
        {new Date(item.startedAt).toLocaleString()}
        {duration ? ` · ${duration}` : ''}
      </Text>
      <Text role="caption" color="color.text.secondary">
        {formatSyncCounts(item)}
      </Text>
    </View>
  );
}

function SyncHistoryListComponent({ items }: SyncHistoryListProps) {
  return (
    <View>
      {items.map((item) => (
        <SyncHistoryRow key={item.id} item={item} />
      ))}
    </View>
  );
}

export const SyncHistoryList = memo(SyncHistoryListComponent);
