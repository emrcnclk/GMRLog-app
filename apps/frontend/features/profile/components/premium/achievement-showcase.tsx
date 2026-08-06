import type { AchievementResponse } from '@gmrlog/types';
import {
  EmptyState,
  ProgressBar,
  SCREEN_GUTTER,
  SectionKicker,
  Skeleton,
  useTheme,
} from '@gmrlog/ui';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import { achievementTotals } from '../../hooks/achievement-showcase-model';
import { selectRarestUnlocks } from '../../hooks/player-record-model';
import { AchievementPlate } from '../achievement-plate';

export interface AchievementShowcaseProps {
  achievements: readonly AchievementResponse[];
  isPending: boolean;
  /** Opens the full Achievements screen (3.1). */
  onPressAll?: () => void;
}

/**
 * §6's "Rarest unlocks".
 *
 * Recomposed from D3.27's grouped showcase rails, which 3.1's own note left for
 * this task: those eight rails re-listed every achievement the dedicated
 * Achievements screen already owns, and §6 asks the profile for the three that
 * rank highest instead. Nothing is lost — the kicker's "All N →" is the same
 * route the rails linked to, and the progress rule above it still states the
 * whole total.
 *
 * The rows are 3.1's `AchievementPlate` unchanged. That component is the rarity
 * table's first consumer, not its owner, and this is the second: radius, notch,
 * glow and border all come out of `rarityGeometry`, so a legendary unlock ranks
 * by shape here exactly as it does on the Achievements screen.
 */
function AchievementShowcaseComponent({
  achievements,
  isPending,
  onPressAll,
}: AchievementShowcaseProps) {
  const theme = useTheme();
  const rarest = useMemo(() => selectRarestUnlocks(achievements), [achievements]);
  const totals = useMemo(() => achievementTotals(achievements), [achievements]);

  if (isPending && achievements.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}>
        <Skeleton shape="line" width="40%" />
        <Skeleton shape="rect" height={theme.space('space.20')} />
      </View>
    );
  }

  if (achievements.length === 0) {
    return (
      <EmptyState
        title="No achievements yet"
        description="Log a game, write a review, or start a collection — badges unlock as you go."
      />
    );
  }

  return (
    <View style={{ gap: theme.space('space.3'), paddingHorizontal: theme.space(SCREEN_GUTTER) }}>
      {onPressAll === undefined ? (
        <SectionKicker
          title="Rarest unlocks"
          counter={`${String(totals.awarded)} / ${String(totals.total)}`}
        />
      ) : (
        <SectionKicker
          title="Rarest unlocks"
          actionLabel={`All ${String(totals.total)} →`}
          onPressAction={onPressAll}
        />
      )}

      <ProgressBar
        value={totals.awarded}
        target={totals.total}
        height={2}
        accessibilityLabel={`${String(totals.percent)} percent of achievements unlocked`}
      />

      {/* Nothing awarded yet: the section still has to say so rather than
          collapsing into the progress rule on its own. */}
      {rarest.length === 0 ? (
        <EmptyState
          title="Nothing unlocked yet"
          description="Your rarest badges land here as you earn them."
        />
      ) : (
        // The plate announces itself as a summary and the kicker's "All N →"
        // already carries the route, so the rows stay unwrapped — a Pressable
        // around a summary would put a button inside a button for assistive
        // tech and buy nothing (3.7's own call on `GameCard`).
        <View style={{ gap: theme.space('space.2') }}>
          {rarest.map((achievement) => (
            <AchievementPlate key={achievement.id} achievement={achievement} />
          ))}
        </View>
      )}
    </View>
  );
}

export const AchievementShowcase = memo(AchievementShowcaseComponent);
