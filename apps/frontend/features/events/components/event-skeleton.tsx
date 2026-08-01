import { Skeleton, SkeletonBlock, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function EventListSkeleton() {
  const theme = useTheme();
  return (
    <SkeletonBlock
      accessibilityLabel="Loading events"
      style={{ gap: theme.space('space.3'), padding: theme.space('space.4') }}
    >
      {[0, 1, 2, 3, 4].map((key) => (
        <View key={key} style={{ gap: theme.space('space.2') }}>
          <Skeleton shape="line" width="70%" height={18} />
          <Skeleton shape="line" width="45%" height={14} />
        </View>
      ))}
    </SkeletonBlock>
  );
}

export function EventDetailSkeleton() {
  const theme = useTheme();
  return (
    <SkeletonBlock accessibilityLabel="Loading event" style={{ gap: theme.space('space.4') }}>
      <Skeleton shape="rect" height={theme.space('space.24')} />
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
        <Skeleton shape="line" width="80%" height={28} />
        <Skeleton shape="line" width="50%" height={14} />
        <Skeleton shape="rect" width="40%" height={40} />
        <Skeleton shape="rect" height={80} />
      </View>
    </SkeletonBlock>
  );
}

/** Alias used by D3.12 component contract. */
export function EventSkeleton() {
  return <EventListSkeleton />;
}
