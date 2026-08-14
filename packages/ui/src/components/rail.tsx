import type { ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';
import { useIsTabletUp } from '../theme/use-breakpoint';

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
 *
 * **8.1 — above the tablet breakpoint (web today; see `useIsTabletUp`'s own
 * doc for why this isn't `Platform.OS`-gated) a rail stops scrolling and wraps
 * into a grid instead**, one shared change here rather than each of the ten-plus
 * call sites re-deriving it. It takes `gaming-insights.tsx`'s existing
 * wrapping-grid convention (2.1/3.9): a top-and-bottom hairline, no vertical
 * dividers — a vertical rule that stops at a wrap point claims a column that
 * does not continue, which is exactly the lie a wrap must not tell. The bleed
 * (content overflowing the screen edge, the entire point of the scrolling
 * form) has no meaning once the row wraps, so the grid is inset symmetrically
 * by the same gutter instead.
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
  const isTabletUp = useIsTabletUp();
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
      ) : isTabletUp ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: gutter,
            paddingVertical: theme.space('space.1'),
            gap: resolvedGap,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.color('color.border.default'),
          }}
        >
          {children}
        </View>
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
