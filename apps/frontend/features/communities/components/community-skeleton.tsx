import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function CommunitySkeleton({ rows = 5 }: { rows?: number }) {
  const theme = useTheme();

  return (
    <View accessibilityLabel="Loading communities" style={{ gap: theme.space('space.3') }}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`community-skel-${String(index)}`}
          style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}
        >
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
            <Skeleton
              shape="circle"
              width={theme.space('space.12')}
              height={theme.space('space.12')}
            />
            <View style={{ flex: 1, gap: theme.space('space.2') }}>
              <Skeleton shape="line" width="50%" />
              <Skeleton shape="line" width="80%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function CommunityDetailSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading community" style={{ gap: theme.space('space.4') }}>
      <Skeleton shape="rect" height={theme.space('space.24')} />
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
        <Skeleton shape="line" width="60%" height={theme.space('space.5')} />
        <Skeleton shape="line" width="90%" />
        <Skeleton shape="line" width="40%" />
        <Skeleton shape="rect" height={theme.space('space.12')} />
      </View>
    </View>
  );
}

export function CommunityMembersSkeleton({ rows = 8 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading members">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`member-skel-${String(index)}`}
          style={{
            flexDirection: 'row',
            gap: theme.space('space.3'),
            padding: theme.space('space.4'),
          }}
        >
          <Skeleton
            shape="circle"
            width={theme.space('space.10')}
            height={theme.space('space.10')}
          />
          <View style={{ flex: 1, gap: theme.space('space.2') }}>
            <Skeleton shape="line" width="45%" />
            <Skeleton shape="line" width="30%" />
          </View>
        </View>
      ))}
    </View>
  );
}
