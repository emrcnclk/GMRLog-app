import type { ReactNode } from 'react';
import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';

import { MIN_TOUCH_TARGET } from '../motion/pressable';
import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface RailProps {
  title: string;
  /** Small line under the title — count, timeframe, or provenance. */
  subtitle?: string;
  /** Trailing affordance, e.g. "See all". Omitted when there is nothing more to show. */
  actionLabel?: string;
  onPressAction?: () => void;
  children: ReactNode;
  /** Space between rail items. */
  gap?: number;
  /** Rendered instead of the scroller when there is nothing yet. */
  emptyState?: ReactNode;
  isEmpty?: boolean;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Titled horizontal shelf — the Steam/Netflix row. Every "Currently playing",
 * "Favourites", "Recently finished", "Screenshots" section is this component,
 * which is what keeps their spacing and header treatment identical.
 */
export function Rail({
  title,
  subtitle,
  actionLabel,
  onPressAction,
  children,
  gap,
  emptyState,
  isEmpty = false,
  style,
}: RailProps) {
  const theme = useTheme();
  const resolvedGap = gap ?? theme.space('space.3');

  return (
    <View style={[{ gap: theme.space('space.3') }, style]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: theme.space('space.3'),
          paddingHorizontal: theme.space('space.4'),
        }}
      >
        <View style={{ flex: 1, gap: theme.space('space.1') }}>
          <Text role="title" numberOfLines={1}>
            {title}
          </Text>
          {subtitle !== undefined ? (
            <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {actionLabel !== undefined && onPressAction !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}: ${title}`}
            onPress={onPressAction}
            hitSlop={8}
            style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
          >
            <Text role="label" color="color.accent.default">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {isEmpty ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>{emptyState}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.space('space.4'),
            gap: resolvedGap,
          }}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}
