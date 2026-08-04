import type { AchievementResponse } from '@gmrlog/types';
import {
  EmptyState,
  MIN_TOUCH_TARGET,
  ProgressBar,
  RARITY_PLATE_MIN,
  Rail,
  RarityBadge,
  Skeleton,
  Text,
  rarityColorToken,
  rarityGeometry,
  useTheme,
} from '@gmrlog/ui';
import { Lock, Trophy } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import {
  achievementRarity,
  achievementTotals,
  buildShowcaseGroups,
  formatAwardedAt,
} from '../../hooks/achievement-showcase-model';

export interface AchievementShowcaseProps {
  achievements: readonly AchievementResponse[];
  isPending: boolean;
  /**
   * Opens the full Achievements screen (3.1). Optional so the widget still
   * renders standalone; the widget itself is 3.9's to recompose.
   */
  onPressAll?: () => void;
}

/**
 * D3.27 Phase 4 — Achievement showcase.
 *
 * Grouped by the LOCKED taxonomy in ACHIEVEMENT_SYSTEM.md (surfaced under the
 * sprint's showcase names), with rarity colour, unlock date and live progress.
 * Locked hidden achievements arrive already redacted from the model.
 */
function AchievementShowcaseComponent({
  achievements,
  isPending,
  onPressAll,
}: AchievementShowcaseProps) {
  const theme = useTheme();
  const groups = useMemo(() => buildShowcaseGroups(achievements), [achievements]);
  const totals = useMemo(() => achievementTotals(achievements), [achievements]);

  if (isPending && achievements.length === 0) {
    return (
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
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
    <View style={{ gap: theme.space('space.5') }}>
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text role="title">Achievements</Text>
          {onPressAll === undefined ? (
            <Text role="label" color="color.text.secondary">
              {`${String(totals.awarded)} / ${String(totals.total)}`}
            </Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`See all ${String(totals.total)} achievements`}
              onPress={onPressAll}
              hitSlop={12}
              style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
            >
              <Text role="metaSm" color="color.accent.default">
                {`All ${String(totals.total)} →`}
              </Text>
            </Pressable>
          )}
        </View>
        <ProgressBar
          value={totals.awarded}
          target={totals.total}
          accessibilityLabel={`${String(totals.percent)} percent of achievements unlocked`}
        />
      </View>

      {groups.map((group) => (
        <Rail
          key={group.id}
          title={group.title}
          subtitle={`${group.description} · ${String(group.awardedCount)} of ${String(
            group.achievements.length,
          )}`}
          gap={theme.space('space.2')}
        >
          {group.achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </Rail>
      ))}
    </View>
  );
}

const BADGE_WIDTH = 148;

export function AchievementBadge({ achievement }: { achievement: AchievementResponse }) {
  const theme = useTheme();
  const awarded = achievement.progress.state === 'awarded';
  const rarity = achievementRarity(achievement);
  const accent = theme.color(rarityColorToken(rarity));
  const plate = rarityGeometry(rarity);
  const unlockedAt = formatAwardedAt(achievement.awardedAt);

  // Awarded badges get a one-shot entrance so a fresh unlock is felt, not just
  // seen. Locked badges stay static.
  const enter = useRef(new Animated.Value(awarded ? 0 : 1)).current;
  useEffect(() => {
    if (!awarded) {
      enter.setValue(1);
      return;
    }
    const animation = Animated.spring(enter, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.7,
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [awarded, enter]);

  const progressLabel = awarded
    ? (unlockedAt ?? 'Unlocked')
    : `${String(achievement.progress.current)} / ${String(achievement.progress.target)}`;

  return (
    <Animated.View
      accessibilityRole="summary"
      accessibilityLabel={`${achievement.title}. ${
        awarded ? `Unlocked ${unlockedAt ?? ''}` : `Locked, ${progressLabel}`
      }. ${rarity}.`}
      style={{
        width: BADGE_WIDTH,
        gap: theme.space('space.2'),
        padding: theme.space('space.3'),
        borderRadius: theme.radius('radius.lg'),
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: awarded ? accent : theme.color('color.border.default'),
        opacity: awarded ? 1 : 0.68,
        transform: [
          {
            scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
          },
        ],
      }}
    >
      {/* The rarity plate. Square and glowing at legendary, a circle with a
          hairline at common — sized at RARITY_PLATE_MIN so the radius ramp
          resolves rather than clamping to a pill. A locked achievement has no
          rank to show, so it stays a neutral circle. */}
      <View
        style={{
          width: RARITY_PLATE_MIN,
          height: RARITY_PLATE_MIN,
          borderRadius: theme.radius(awarded ? plate.radius : 'radius.full'),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: awarded
            ? theme.color('color.background.tertiary')
            : theme.color('color.background.secondary'),
          borderWidth: 1,
          borderColor: awarded ? accent : theme.color('color.border.default'),
          ...(awarded ? theme.elevation(plate.elevation) : null),
          shadowColor: accent,
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        {awarded ? (
          <Trophy size={18} color={accent} />
        ) : (
          <Lock size={16} color={theme.color('color.text.tertiary')} />
        )}
      </View>

      <Text role="label" numberOfLines={2}>
        {achievement.title}
      </Text>
      <Text role="meta" color="color.text.tertiary" numberOfLines={2}>
        {achievement.description}
      </Text>

      {!awarded && achievement.progress.target > 0 ? (
        <ProgressBar
          value={achievement.progress.current}
          target={achievement.progress.target}
          height={4}
          fillColor="color.text.tertiary"
          accessibilityLabel={`Progress ${progressLabel}`}
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <RarityBadge tier={rarity} />
      </View>

      <Text role="meta" color="color.text.tertiary">
        {progressLabel}
      </Text>
    </Animated.View>
  );
}

export const AchievementShowcase = memo(AchievementShowcaseComponent);
