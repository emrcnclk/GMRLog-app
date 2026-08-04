import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { SCREEN_GUTTER } from './screen-title';
import { SectionKicker } from './section-kicker';
import { Text } from './text';

export interface RailProps {
  title: string;
  /** Small line under the kicker — count, timeframe, or provenance. */
  subtitle?: string;
  /** Right-aligned counter on the kicker line. Pre-formatted. */
  counter?: string;
  /** Trailing affordance, e.g. "All 412 →". Omitted when there is nothing more to show. */
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
 *
 * **The rail bleeds.** Cards run off the right edge of the screen; that overflow
 * is the point, because a row that ends flush reads as a finished list rather
 * than as a shelf you can push. The scroller therefore spans the full width and
 * insets its own content by `SCREEN_GUTTER`, so the first card lines up with the
 * kicker above it while the last one runs past the edge. A rail must never be
 * centred, and must never sit inside a horizontally padded container — that
 * padding is what turns a bleed back into a boxed row.
 *
 * The header is a `SectionKicker`: the redesign has no bold section headings,
 * and a rail is a section like any other.
 */
export function Rail({
  title,
  subtitle,
  counter,
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
  const gutter = theme.space(SCREEN_GUTTER);

  return (
    <View style={[{ gap: theme.space('space.3') }, style]}>
      <View style={{ paddingHorizontal: gutter, gap: theme.space('space.1') }}>
        <SectionKicker
          title={title}
          counter={counter}
          actionLabel={actionLabel}
          onPressAction={onPressAction}
        />
        {subtitle !== undefined ? (
          <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {isEmpty ? (
        <View style={{ paddingHorizontal: gutter }}>{emptyState}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: gutter,
            gap: resolvedGap,
          }}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}
