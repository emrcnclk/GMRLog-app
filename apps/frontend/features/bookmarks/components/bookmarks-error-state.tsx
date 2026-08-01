import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function BookmarksErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.3'),
      }}
    >
      <Text role="title" color="color.text.primary">
        {title}
      </Text>
      {description ? (
        <Text role="body" color="color.text.secondary" style={{ textAlign: 'center' }}>
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Text
          role="label"
          color="color.interactive.primary"
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          Retry
        </Text>
      ) : null}
    </View>
  );
}
