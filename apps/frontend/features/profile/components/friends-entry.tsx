import { Text, useTheme } from '@gmrlog/ui';
import { ChevronRight, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export interface FriendsEntryProps {
  friendCount: number;
  onPress: () => void;
}

/** Overview entry to Friends screen — no new profile tab. */
export function FriendsEntry({ friendCount, onPress }: FriendsEntryProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');
  const label = friendCount === 1 ? '1 friend' : `${String(friendCount)} friends`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open friends. ${label}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        minHeight: hit,
        marginHorizontal: theme.space('space.4'),
        marginTop: theme.space('space.2'),
        marginBottom: theme.space('space.2'),
        paddingHorizontal: theme.space('space.3'),
        paddingVertical: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <Users size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" color="color.text.primary">
          Friends
        </Text>
        <Text role="caption" color="color.text.secondary">
          {label}
        </Text>
      </View>
      <ChevronRight size={18} color={theme.color('color.text.tertiary')} strokeWidth={1.75} />
    </Pressable>
  );
}
