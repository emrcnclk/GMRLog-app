import { Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Switch, View } from 'react-native';

export interface NotificationPrefRowProps {
  title: string;
  subtitle: string;
}

/** Honest disabled row — no notification preferences PATCH on frozen backend. */
function NotificationPrefRowComponent({ title, subtitle }: NotificationPrefRowProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityLabel={`${title} unavailable`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        opacity: 0.7,
      }}
    >
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="title" color="color.text.primary">
          {title}
        </Text>
        <Text role="meta" color="color.text.secondary">
          {subtitle}
        </Text>
      </View>
      <Switch value={false} disabled accessibilityLabel={`${title} disabled`} />
    </View>
  );
}

export const NotificationPrefRow = memo(NotificationPrefRowComponent);
