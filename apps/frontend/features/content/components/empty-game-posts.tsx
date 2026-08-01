import { Button, EmptyState, useTheme } from '@gmrlog/ui';
import { MessageSquare } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptyGamePostsProps {
  onCreate?: () => void;
}

export function EmptyGamePosts({ onCreate }: EmptyGamePostsProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
        gap: theme.space('space.4'),
      }}
    >
      <View
        accessibilityLabel="Empty posts illustration"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageSquare size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState title="No posts yet" description="Start a conversation about this game." />
      {onCreate ? (
        <Button variant="primary" accessibilityLabel="Write a post" onPress={onCreate}>
          Write a post
        </Button>
      ) : null}
    </View>
  );
}
