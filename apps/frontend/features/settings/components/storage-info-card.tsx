import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import type { StorageInfoSnapshot } from '../model/storage-model';

export interface StorageInfoCardProps {
  info: StorageInfoSnapshot;
}

function StorageInfoCardComponent({ info }: StorageInfoCardProps) {
  const theme = useTheme();
  const rows = [
    { label: 'Image cache', value: info.imageCacheLabel },
    { label: 'React Query', value: info.queryCacheLabel },
    { label: 'SecureStore', value: info.secureStoreLabel },
  ];

  return (
    <View
      accessibilityLabel="Storage information"
      style={{
        marginHorizontal: theme.space('space.4'),
        padding: theme.space('space.4'),
        borderRadius: theme.radius('radius.md'),
        backgroundColor: theme.color('color.surface.secondary'),
        gap: theme.space('space.3'),
      }}
    >
      {rows.map((row) => (
        <View key={row.label} style={{ gap: theme.space('space.1') }}>
          <Text role="label" color="color.text.secondary">
            {row.label}
          </Text>
          <Text role="body" color="color.text.primary">
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

export const StorageInfoCard = memo(StorageInfoCardComponent);
