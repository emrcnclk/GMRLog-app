import { Text, useTheme } from '@gmrlog/ui';
import { Bookmark, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

export interface BookmarksEntryProps {
  onPress: () => void;
}

/** Overview entry to private bookmarks — D3.24 SOCIAL_ACTIONS. */
export function BookmarksEntry({ onPress }: BookmarksEntryProps) {
  const theme = useTheme();
  const hit = theme.space('space.12');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open bookmarks"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.3'),
        minHeight: hit,
        marginHorizontal: theme.space('space.4'),
        marginBottom: theme.space('space.2'),
        paddingHorizontal: theme.space('space.3'),
        paddingVertical: theme.space('space.3'),
        borderRadius: theme.radius('radius.md'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <Bookmark size={20} color={theme.color('color.text.secondary')} strokeWidth={1.75} />
      <View style={{ flex: 1, gap: theme.space('space.1') }}>
        <Text role="label" color="color.text.primary">
          Bookmarks
        </Text>
        <Text role="caption" color="color.text.secondary">
          Saved posts
        </Text>
      </View>
      <ChevronRight size={18} color={theme.color('color.text.tertiary')} strokeWidth={1.75} />
    </Pressable>
  );
}
