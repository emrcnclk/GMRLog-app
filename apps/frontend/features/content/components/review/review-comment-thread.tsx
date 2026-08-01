import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { userInitials } from '../../../../shared/user/initials';
import type { CommentThread } from '../../hooks/review-detail-model';

export interface ReviewCommentThreadProps {
  thread: CommentThread;
  onReply: (parentCommentId: string) => void;
  onPressAuthor: (userId: string) => void;
}

/**
 * One root comment and its replies.
 *
 * Replies indent exactly once. Depth beyond that costs more readable width than
 * the hierarchy is worth on a phone, so `buildCommentThreads` flattens deeper
 * chains into this single level rather than rendering slivers.
 */
function ReviewCommentThreadComponent({
  thread,
  onReply,
  onPressAuthor,
}: ReviewCommentThreadProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <CommentRow
        authorId={thread.comment.author.id}
        displayName={thread.comment.author.displayName}
        avatarUrl={thread.comment.author.avatarUrl}
        body={thread.comment.body}
        onPressAuthor={onPressAuthor}
        onReply={() => {
          onReply(thread.comment.id);
        }}
      />

      {thread.replies.length > 0 ? (
        <View
          style={{
            marginLeft: theme.space('space.6'),
            paddingLeft: theme.space('space.4'),
            gap: theme.space('space.3'),
            borderLeftWidth: 1,
            borderLeftColor: theme.color('color.border.default'),
          }}
        >
          {thread.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              authorId={reply.author.id}
              displayName={reply.author.displayName}
              avatarUrl={reply.author.avatarUrl}
              body={reply.body}
              onPressAuthor={onPressAuthor}
              onReply={() => {
                // Replying to a reply still lands on the root thread.
                onReply(thread.comment.id);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface CommentRowProps {
  authorId: string;
  displayName: string;
  avatarUrl: string | null;
  body: string;
  onPressAuthor: (userId: string) => void;
  onReply: () => void;
}

function CommentRow({
  authorId,
  displayName,
  avatarUrl,
  body,
  onPressAuthor,
  onReply,
}: CommentRowProps) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${displayName}'s profile`}
        onPress={() => {
          onPressAuthor(authorId);
        }}
        hitSlop={8}
      >
        <Avatar
          size="sm"
          uri={avatarUrl ?? undefined}
          initials={userInitials(displayName)}
          accessibilityLabel={`${displayName} avatar`}
        />
      </Pressable>

      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" numberOfLines={1}>
          {displayName}
        </Text>
        <Text role="body" color="color.text.secondary">
          {body}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${displayName}`}
          onPress={onReply}
          hitSlop={8}
          style={{ minHeight: theme.space('space.10'), justifyContent: 'center' }}
        >
          <Text role="meta" color="color.accent.default">
            Reply
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const ReviewCommentThread = memo(ReviewCommentThreadComponent);
