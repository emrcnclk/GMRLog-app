import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { PostCard } from '../../content/components/post-card';
import type { BookmarkPostRow } from '../hooks/bookmarks-model';

export interface BookmarkCardProps {
  row: BookmarkPostRow;
  onPressPost: (postId: string) => void;
}

export function BookmarkCard({ row, onPressPost }: BookmarkCardProps) {
  const theme = useTheme();

  if (!row.post) {
    return (
      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <Text role="body" color="color.text.secondary">
          Saved post unavailable
        </Text>
        <Text role="meta" color="color.text.tertiary">
          {row.bookmark.postId}
        </Text>
      </View>
    );
  }

  return <PostCard post={row.post} onPress={onPressPost} />;
}
