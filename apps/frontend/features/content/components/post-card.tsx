import type { PostResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { visibilityLabel } from '../hooks/content-model';

export interface PostCardProps {
  post: PostResponse;
  onPress: (postId: string) => void;
  onPressGame?: (gameId: string) => void;
  onPressEdit?: (postId: string) => void;
}

function PostCardComponent({ post, onPress, onPressGame, onPressEdit }: PostCardProps) {
  const theme = useTheme();
  const authorName = post.author.displayName;
  const gameTitle = post.game?.title;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Post by ${authorName}`}
      onPress={() => {
        onPress(post.id);
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
        <Text role="label" color="color.text.primary" numberOfLines={1} style={{ flex: 1 }}>
          {authorName}
        </Text>
        <Badge tone="neutral">{visibilityLabel(post.visibility)}</Badge>
      </View>

      <Text role="body" color="color.text.secondary" numberOfLines={4}>
        {post.body}
      </Text>

      {post.gameId && gameTitle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${gameTitle}`}
          disabled={!onPressGame}
          onPress={() => {
            if (post.gameId) {
              onPressGame?.(post.gameId);
            }
          }}
        >
          <Text role="meta" color="color.text.tertiary">
            {gameTitle}
          </Text>
        </Pressable>
      ) : null}

      {onPressEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit post"
          onPress={() => {
            onPressEdit(post.id);
          }}
          hitSlop={8}
          style={{
            alignSelf: 'flex-start',
            minHeight: theme.space('space.10'),
            justifyContent: 'center',
          }}
        >
          <Text role="label" color="color.interactive.primary">
            Edit
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const PostCard = memo(PostCardComponent);
