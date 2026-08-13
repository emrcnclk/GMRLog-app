import type { CreatorProfileResponse } from '@gmrlog/types';
import { MetricStrip, SCREEN_GUTTER, StatTile, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { creatorMetricCells } from '../hooks/creator-hub-model';

export interface CreatorMetricStripProps {
  creator: CreatorProfileResponse | null;
}

/**
 * §25's Followers / Lists / Reviews / Partners strip — two cells, not four.
 * See `creatorMetricCells`'s doc comment for why Reviews and Partners are
 * dropped rather than shown as zero. `MetricStrip` is a single row by
 * definition (top+bottom hairlines, never vertical dividers) regardless of
 * cell count.
 */
export function CreatorMetricStrip({ creator }: CreatorMetricStripProps) {
  const theme = useTheme();
  const cells = creatorMetricCells(creator);

  if (cells.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER) }}>
      <MetricStrip accessibilityLabel="Creator totals">
        {cells.map((cell) => (
          <StatTile key={cell.key} value={cell.value} label={cell.label} />
        ))}
      </MetricStrip>
    </View>
  );
}
