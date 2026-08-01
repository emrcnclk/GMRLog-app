import type { TierListResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { countTierListGames, formatUpdatedAt, visibilityLabel } from '../hooks/tier-list-model';

export interface TierListCardProps {
  tierList: TierListResponse;
  onPress: (tierListId: string) => void;
}

function TierListCardComponent({ tierList, onPress }: TierListCardProps) {
  const theme = useTheme();
  const gameCount = countTierListGames(tierList);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tierList.title}, ${visibilityLabel(tierList.visibility)}, ${String(gameCount)} games`}
      onPress={() => {
        onPress(tierList.id);
      }}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
        minHeight: theme.space('space.16'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space('space.2'),
        }}
      >
        <Text role="label" color="color.text.primary" numberOfLines={2} style={{ flex: 1 }}>
          {tierList.title}
        </Text>
        <Badge tone="neutral">{visibilityLabel(tierList.visibility)}</Badge>
      </View>
      <Text role="meta" color="color.text.tertiary">
        {String(gameCount)} games · {String(tierList.slots.length)} tiers · Updated{' '}
        {formatUpdatedAt(tierList.updatedAt)}
      </Text>
    </Pressable>
  );
}

export const TierListCard = memo(TierListCardComponent);
