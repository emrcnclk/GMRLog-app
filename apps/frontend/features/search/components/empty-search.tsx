import { EmptyState, useTheme } from '@gmrlog/ui';
import { Search } from 'lucide-react-native';
import { View } from 'react-native';

export interface EmptySearchProps {
  query?: string;
}

export function EmptySearch({ query }: EmptySearchProps) {
  const theme = useTheme();
  const title = query ? 'No results' : 'Nothing here yet';
  const description = query
    ? `Nothing matched “${query}”. Try another term.`
    : 'Search games, people, and culture across GMRLOG.';

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space('space.6'),
      }}
    >
      <View
        accessibilityLabel="Search illustration placeholder"
        style={{
          width: theme.space('space.16'),
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: theme.color('color.surface.secondary'),
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.space('space.4'),
        }}
      >
        <Search size={36} color={theme.color('color.text.secondary')} strokeWidth={1.5} />
      </View>
      <EmptyState title={title} description={description} />
    </View>
  );
}
