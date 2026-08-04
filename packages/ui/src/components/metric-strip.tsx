import { Children, type ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

export interface MetricStripProps {
  /** Three or four `StatTile`s. More than four stops reading as a strip. */
  children: ReactNode;
  /** Describes the set for assistive tech, e.g. "Library totals". */
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Three or four figures in a row, divided by hairline verticals and bounded by a
 * hairline above and below (SCREEN_REDESIGNS.md §"Shared patterns"). Used on
 * Profile, Game hub, Player and Community detail.
 *
 * The strip owns every rule so the tiles do not: `StatTile` draws no border and
 * no surface, which is what stops four adjacent tiles rendering four adjacent
 * cards. Structure comes from the hairlines and from space, not from filling
 * each cell.
 *
 * The dividers are inserted between children rather than drawn as a trailing
 * border on each tile — a trailing border leaves a stray rule after the last
 * cell, which is the usual way this pattern goes wrong.
 *
 * **Layout-neutral by design.** The redesign places the strip at `margin 0 20px`,
 * but the strip does not apply that itself: it is dropped into containers that
 * already carry a gutter as often as into ones that do not, and a built-in
 * margin would silently double the inset in the first case. Callers position it —
 * `SCREEN_GUTTER` is exported for the ones that need the redesign's value.
 */
export function MetricStrip({ children, accessibilityLabel, style }: MetricStripProps) {
  const theme = useTheme();
  const items = Children.toArray(children);
  const hairline = theme.color('color.border.default');

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'stretch',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: hairline,
        },
        style,
      ]}
    >
      {items.map((child, index) => (
        <View
          // Children of a strip are a fixed, ordered set — there is no stable id
          // to key on and no reordering for an index key to get wrong.
          key={`metric-${String(index)}`}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'stretch',
          }}
        >
          {index > 0 ? <View style={{ width: 1, backgroundColor: hairline }} /> : null}
          <View style={{ flex: 1 }}>{child}</View>
        </View>
      ))}
    </View>
  );
}
