import type { CollectionEntryResponse } from '@gmrlog/types';
import { Button, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface CollectionEntryCardProps {
  entry: CollectionEntryResponse;
  editable?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}

function CollectionEntryCardComponent({
  entry,
  editable = false,
  onMoveUp,
  onMoveDown,
  onRemove,
}: CollectionEntryCardProps) {
  const theme = useTheme();
  const title = entry.game?.title ?? entry.gameId;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${title}${entry.note ? `, note ${entry.note}` : ''}`}
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        gap: theme.space('space.2'),
        minHeight: theme.space('space.12'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Text role="label" color="color.text.primary">
        {title}
      </Text>
      {entry.note ? (
        <Text role="body" color="color.text.secondary">
          {entry.note}
        </Text>
      ) : null}
      {editable ? (
        <View style={{ flexDirection: 'row', gap: theme.space('space.2'), flexWrap: 'wrap' }}>
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={`Move ${title} up`}
            onPress={onMoveUp}
          >
            Up
          </Button>
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={`Move ${title} down`}
            onPress={onMoveDown}
          >
            Down
          </Button>
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={`Remove ${title}`}
            onPress={onRemove}
          >
            Remove
          </Button>
        </View>
      ) : null}
    </View>
  );
}

export const CollectionEntryCard = memo(CollectionEntryCardComponent);
