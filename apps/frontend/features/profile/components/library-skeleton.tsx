import { Skeleton, Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function LibrarySkeleton({ sections = 3 }: { sections?: number }) {
  const theme = useTheme();
  const cover = theme.space('space.16');

  return (
    <View accessibilityLabel="Loading library" style={{ gap: theme.space('space.4') }}>
      {Array.from({ length: sections }, (_, sectionIndex) => (
        <View
          key={`library-skel-section-${String(sectionIndex)}`}
          style={{ gap: theme.space('space.3') }}
        >
          <Skeleton
            shape="line"
            width="40%"
            height={theme.space('space.5')}
            style={{ marginHorizontal: theme.space('space.4') }}
          />
          <View
            style={{
              flexDirection: 'row',
              gap: theme.space('space.3'),
              paddingHorizontal: theme.space('space.4'),
            }}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <View
                key={`library-skel-card-${String(sectionIndex)}-${String(index)}`}
                style={{ gap: theme.space('space.2') }}
              >
                <Skeleton shape="rect" width={cover} height={cover} />
                <Skeleton shape="line" width={cover} />
              </View>
            ))}
          </View>
        </View>
      ))}
      <Text
        role="caption"
        color="color.text.tertiary"
        style={{ paddingHorizontal: theme.space('space.4') }}
      >
        Loading shelves…
      </Text>
    </View>
  );
}
