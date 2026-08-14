import type { AchievementResponse } from '@gmrlog/types';
import {
  CornerNotch,
  ProgressBar,
  RARITY_LABELS,
  RARITY_PLATE_MIN,
  RarityBadge,
  Text,
  rarityColorToken,
  rarityGeometry,
  useTheme,
} from '@gmrlog/ui';
import { Lock, Trophy } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';

import {
  achievementRarity,
  formatAwardedAt,
  formatHolderPercent,
} from '../hooks/achievement-showcase-model';

export interface AchievementPlateProps {
  achievement: AchievementResponse;
}

/** Locked rows dim their content, never their geometry (SCREEN_REDESIGNS.md §8). */
const LOCKED_OPACITY = 0.42;

/**
 * Derived from `RARITY_PLATE_MIN` rather than typed as 40, so the plate cannot
 * drift under the floor at which RN stops clamping the radius ramp.
 */
const ICON_PLATE = RARITY_PLATE_MIN + 8;

/**
 * The rarity plate — one achievement as a row (`SCREEN_REDESIGNS.md` §8).
 *
 * This is the screen the redesign calls "the clearest demonstration of
 * rarity-by-geometry", and the plate is why: **four channels carry the tier and
 * none of them is colour.** The icon plate's radius sharpens from a circle to a
 * square, the corner notch lengthens from nothing to a full corner, an ambient
 * glow arrives at the top two tiers, and the outline steps from a hairline to
 * the accent. Every one of those still reads on the `neutral` accent and in
 * monochrome; the rarity colour on the glyph is the fifth channel, and the only
 * one that may be missed.
 *
 * The whole ramp comes from `rarityGeometry(tier)` in `@gmrlog/ui` rather than a
 * table in this file, because the rest of the app reuses it — this component is
 * its first consumer, not its owner.
 */
function AchievementPlateComponent({ achievement }: AchievementPlateProps) {
  const theme = useTheme();

  const awarded = achievement.progress.state === 'awarded';
  const rarity = achievementRarity(achievement);
  const rarityColor = theme.color(rarityColorToken(rarity));
  const plate = rarityGeometry(rarity);
  const unlockedAt = formatAwardedAt(achievement.awardedAt);

  // 9.3 supplied the field §8 asked for: a server-computed holder share, never
  // derived here. The unlock-date/progress fact stays as the fallback — it's
  // the correct behaviour when holderPercent is absent (older data, or a
  // redacted hidden row), not a placeholder being replaced.
  const fact = awarded
    ? (unlockedAt ?? 'Unlocked')
    : `${String(achievement.progress.current)} / ${String(achievement.progress.target)}`;
  const holderText = formatHolderPercent(achievement.holderPercent);
  const metaText = holderText != null ? `${fact} · ${holderText}` : fact;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${achievement.title}. ${achievement.description} ${
        awarded ? `Unlocked ${unlockedAt ?? ''}` : `Locked, ${fact}`
      }. ${RARITY_LABELS[rarity]}.`}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.space('space.4'),
        padding: theme.space('space.4'),
        borderRadius: theme.radius('radius.lg'),
        backgroundColor: theme.color('color.surface.secondary'),
        borderWidth: 1,
        borderColor: theme.color(plate.border),
        // The glow is ambient, so it takes the accent and drops the elevation
        // token's downward offset — a lift would read as a card, not a plate.
        ...theme.elevation(plate.elevation),
        shadowColor: theme.color('color.accent.default'),
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {plate.cornerNotch !== null ? (
        <CornerNotch length={plate.cornerNotch} vertical={plate.cornerNotchVertical} />
      ) : null}

      <View
        style={{
          width: ICON_PLATE,
          height: ICON_PLATE,
          borderRadius: theme.radius(plate.radius),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.color('color.background.tertiary'),
          borderWidth: 1,
          borderColor: rarityColor,
        }}
      >
        {/* The dimming stops at the glyph: a locked row still has to say which
            tier you are missing, and the plate's shape is what says it. */}
        <View style={{ opacity: awarded ? 1 : LOCKED_OPACITY }}>
          {awarded ? (
            <Trophy size={18} color={rarityColor} strokeWidth={1.75} />
          ) : (
            <Lock size={16} color={theme.color('color.text.tertiary')} strokeWidth={1.75} />
          )}
        </View>
      </View>

      <View
        style={{
          flex: 1,
          gap: theme.space('space.2'),
          opacity: awarded ? 1 : LOCKED_OPACITY,
        }}
      >
        {/* `headline`, not `label`: the row's title has to outrank its own
            description, and `label` (12) sits *under* `bodySm` (13). */}
        <Text role="headline" numberOfLines={2}>
          {achievement.title}
        </Text>
        <Text role="bodySm" color="color.text.secondary" numberOfLines={3}>
          {achievement.description}
        </Text>

        {!awarded && achievement.progress.target > 0 ? (
          <ProgressBar
            value={achievement.progress.current}
            target={achievement.progress.target}
            height={2}
            fillColor="color.text.tertiary"
            accessibilityLabel={`Progress ${fact}`}
          />
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.space('space.3'),
          }}
        >
          <RarityBadge tier={rarity} />
          <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
            {metaText}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const AchievementPlate = memo(AchievementPlateComponent);
