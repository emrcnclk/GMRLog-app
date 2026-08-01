import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function SearchResultSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
      }}
    >
      <Skeleton shape="rect" width={theme.space('space.10')} height={theme.space('space.10')} />
      <View style={{ flex: 1, gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="55%" />
        <Skeleton shape="line" width="80%" />
      </View>
    </View>
  );
}

export function SearchSkeleton({ rows = 8 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space('space.1'), paddingTop: theme.space('space.2') }}>
      {Array.from({ length: rows }, (_, index) => (
        <SearchResultSkeleton key={`search-skeleton-${String(index)}`} />
      ))}
    </View>
  );
}
