import { Icon, Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

export interface ReviewActionBarProps {
  onQuote: () => void;
  onShare: () => void;
  onCopyLink: () => void;
  onReply: () => void;
  replyCount: number;
  /** Set briefly after a copy so the control can confirm it worked. */
  linkCopied: boolean;
}

/**
 * The row of things you can do with a review.
 *
 * Every action carries a word, not just a glyph. Icon-only bars are compact but
 * force the reader to decode them, and "quote" versus "reply" is exactly the
 * distinction an ambiguous icon loses.
 */
function ReviewActionBarComponent({
  onQuote,
  onShare,
  onCopyLink,
  onReply,
  replyCount,
  linkCopied,
}: ReviewActionBarProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.1'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.2'),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.color('color.border.default'),
      }}
    >
      <ReviewAction
        icon="message-circle"
        label={replyCount > 0 ? `Reply (${String(replyCount)})` : 'Reply'}
        accessibilityLabel={
          replyCount > 0 ? `Reply. ${String(replyCount)} existing replies` : 'Reply to this review'
        }
        onPress={onReply}
      />
      <ReviewAction
        icon="quote"
        label="Quote"
        accessibilityLabel="Quote this review in a new post"
        onPress={onQuote}
      />
      <ReviewAction
        icon={linkCopied ? 'check' : 'link'}
        label={linkCopied ? 'Copied' : 'Copy link'}
        accessibilityLabel={linkCopied ? 'Link copied' : 'Copy link to this review'}
        onPress={onCopyLink}
      />
      <ReviewAction
        icon="share-2"
        label="Share"
        accessibilityLabel="Share this review"
        onPress={onShare}
      />
    </View>
  );
}

interface ReviewActionProps {
  icon: string;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}

function ReviewAction({ icon, label, accessibilityLabel, onPress }: ReviewActionProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space('space.1'),
          minHeight: theme.space('space.12'),
          borderRadius: theme.radius('radius.md'),
        },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <Icon name={icon} decorative size={18} color="color.text.secondary" />
      <Text role="meta" color="color.text.secondary" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export const ReviewActionBar = memo(ReviewActionBarComponent);
