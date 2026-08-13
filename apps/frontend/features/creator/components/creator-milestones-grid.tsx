import type { AchievementResponse } from '@gmrlog/types';
import {
  EmptyState,
  RARITY_LABELS,
  RARITY_PLATE_MIN,
  RarityBadge,
  Text,
  rarityColorToken,
  rarityGeometry,
  useTheme,
} from '@gmrlog/ui';
import { Trophy } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import {
  achievementRarity,
  formatAwardedAt,
  presentAchievement,
} from '../../profile/hooks/achievement-showcase-model';
import { creatorMilestones } from '../hooks/creator-hub-model';

export interface CreatorMilestonesGridProps {
  achievements: readonly AchievementResponse[];
  isPending: boolean;
}

const ICON_PLATE = RARITY_PLATE_MIN;
const COLUMN_GAP = 8;

/**
 * §25's "Creator milestones" — "a three-column grid of badge plates using the
 * same rarity geometry as achievements". Read literally: this is the
 * creator's own real, awarded `Achievement` rows (`achievement-plate.tsx`'s
 * exact rarity derivation reused, not re-invented), not the separate
 * `ReputationBadge` enum — that has no rarity concept behind it at all, and
 * inventing a tier ranking for it would be exactly the client-side fabrication
 * CLAUDE.md rules out for scores. See `creatorMilestones`'s doc comment.
 */
export function CreatorMilestonesGrid({ achievements, isPending }: CreatorMilestonesGridProps) {
  if (isPending && achievements.length === 0) {
    return null;
  }

  const milestones = creatorMilestones(achievements);

  if (milestones.length === 0) {
    return (
      <EmptyState
        title="No milestones yet"
        description="Awarded achievements will show up here as this creator earns them."
      />
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: COLUMN_GAP }}>
      {milestones.map((achievement) => (
        <MilestonePlate key={achievement.id} achievement={achievement} />
      ))}
    </View>
  );
}

function MilestonePlateComponent({ achievement }: { achievement: AchievementResponse }) {
  const theme = useTheme();
  const presented = presentAchievement(achievement);
  const rarity = achievementRarity(achievement);
  const accent = theme.color(rarityColorToken(rarity));
  const plate = rarityGeometry(rarity);
  const unlockedAt = formatAwardedAt(achievement.awardedAt);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${presented.title}. ${RARITY_LABELS[rarity]}. ${unlockedAt ?? 'Unlocked'}.`}
      style={{
        // Three columns: flexBasis under a third leaves room for the two
        // inter-column gaps without percentage arithmetic against an unknown
        // container width — the same tolerance `CoverMosaic`'s literal 2px
        // gap already takes for a decorative grid line.
        flexBasis: '31%',
        flexGrow: 1,
        gap: theme.space('space.2'),
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.lg'),
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color(plate.border),
        alignItems: 'center',
        ...theme.elevation(plate.elevation),
        shadowColor: theme.color('color.accent.default'),
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View
        style={{
          width: ICON_PLATE,
          height: ICON_PLATE,
          borderRadius: theme.radius(plate.radius),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.color('color.background.tertiary'),
          borderWidth: 1,
          borderColor: accent,
        }}
      >
        <Trophy size={16} color={accent} strokeWidth={1.75} />
      </View>

      <Text role="label" numberOfLines={2} style={{ textAlign: 'center' }}>
        {presented.title}
      </Text>

      <RarityBadge tier={rarity} />
    </View>
  );
}

const MilestonePlate = memo(MilestonePlateComponent);
