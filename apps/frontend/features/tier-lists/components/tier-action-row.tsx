import { Button, useTheme } from '@gmrlog/ui';
import { GitFork, Heart, Share2 } from 'lucide-react-native';
import { View } from 'react-native';

export interface TierActionRowProps {
  liked: boolean;
  onFork: () => void;
  onLike: () => void;
  onShare: () => void;
  forkPending?: boolean;
  likePending?: boolean;
}

/** §20: "Action row: Fork, Like, Share — outlined, equal width." */
export function TierActionRow({
  liked,
  onFork,
  onLike,
  onShare,
  forkPending = false,
  likePending = false,
}: TierActionRowProps) {
  const theme = useTheme();
  const iconColor = theme.color('color.text.primary');
  const likedColor = theme.color('color.accent.default');

  return (
    <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
      <Button
        variant="secondary"
        accessibilityLabel="Fork this tier list into your own"
        loading={forkPending}
        icon={<GitFork size={15} color={iconColor} strokeWidth={1.75} />}
        onPress={onFork}
        style={{ flex: 1 }}
      >
        Fork
      </Button>
      <Button
        variant="secondary"
        accessibilityLabel={liked ? 'Unlike this tier list' : 'Like this tier list'}
        loading={likePending}
        icon={<Heart size={15} color={liked ? likedColor : iconColor} strokeWidth={1.75} />}
        onPress={onLike}
        style={{ flex: 1 }}
      >
        Like
      </Button>
      <Button
        variant="secondary"
        accessibilityLabel="Share this tier list"
        icon={<Share2 size={15} color={iconColor} strokeWidth={1.75} />}
        onPress={onShare}
        style={{ flex: 1 }}
      >
        Share
      </Button>
    </View>
  );
}
