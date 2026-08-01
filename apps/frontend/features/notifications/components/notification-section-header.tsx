import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface NotificationSectionHeaderProps {
  title: string;
}

/**
 * Day divider in the notification list.
 *
 * Opaque background, not transparent: this rides `stickySectionHeadersEnabled`,
 * and a see-through header would let rows scroll visibly underneath it.
 */
function NotificationSectionHeaderComponent({ title }: NotificationSectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.space('space.4'),
        paddingTop: theme.space('space.4'),
        paddingBottom: theme.space('space.2'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <Text role="label" color="color.text.tertiary" accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

export const NotificationSectionHeader = memo(NotificationSectionHeaderComponent);
