import { SCREEN_GUTTER, SectionKicker, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface NotificationSectionHeaderProps {
  title: string;
}

/**
 * Day-bucket kicker in the notification list.
 *
 * Opaque background, not transparent: this rides `stickySectionHeadersEnabled`,
 * and a see-through header would let rows scroll visibly underneath it.
 */
function NotificationSectionHeaderComponent({ title }: NotificationSectionHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingTop: theme.space('space.5'),
        paddingBottom: theme.space('space.2'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <SectionKicker title={title} />
    </View>
  );
}

export const NotificationSectionHeader = memo(NotificationSectionHeaderComponent);
