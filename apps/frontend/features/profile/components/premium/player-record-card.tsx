import type {
  AchievementResponse,
  PlayerArchetypeResponse,
  ProfileHeroResponse,
  UserSelfResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import {
  Avatar,
  CornerNotch,
  Divider,
  HatchOverlay,
  MIN_TOUCH_TARGET,
  RARITY_LABELS,
  RARITY_PLATE_MIN,
  Skeleton,
  Text,
  rarityColorToken,
  rarityGeometry,
  useTheme,
} from '@gmrlog/ui';
import { Trophy } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { userInitials } from '../../../../shared/user/initials';
import { resolveArchetypePair } from '../../hooks/archetype-catalog';
import {
  buildRecordStats,
  buildRecordTraits,
  formatRecordSince,
  selectRecordBadges,
  type RecordBadge,
  type RecordTrait,
} from '../../hooks/player-record-model';

export interface PlayerRecordCardProps {
  user: UserSelfResponse;
  hero: ProfileHeroResponse | null;
  statistics: UserStatisticsResponse | null;
  archetypes: readonly PlayerArchetypeResponse[];
  achievements: readonly AchievementResponse[];
  isPending: boolean;
  /** §6: "Tapping opens the badge case" — the Achievements screen from 3.1. */
  onPressBadgeCase: () => void;
}

/**
 * §6 — the player record card.
 *
 * The strongest of the three hero variants the prototype ships and, as the doc
 * puts it, the one the whole product is named after: a single bounded object
 * that answers *what kind of gamer are you* before any list does.
 *
 * Structure comes from four rules and the space between them, not from drawn
 * boxes: identity, archetype, badges, figures. The only marks on the surface are
 * the diagonal hatch, the two corner notches and the hairline dividers — no
 * gradient (the system takes no gradient dependency; see `GradientScrim`) and no
 * shadow (`THEME_MIGRATION.md` §5 removed the shadow dependency outright), which
 * is why §6's "subtle" texture is carried by `HatchOverlay` and the card's lift
 * by `color.background.elevated` alone.
 *
 * Nothing here computes a score. `buildRecordStats`, `buildRecordTraits` and
 * `selectRecordBadges` are pure projections over what the API returned.
 */
function PlayerRecordCardComponent({
  user,
  hero,
  statistics,
  archetypes,
  achievements,
  isPending,
  onPressBadgeCase,
}: PlayerRecordCardProps) {
  const theme = useTheme();

  const primary = useMemo(() => resolveArchetypePair(archetypes).primary, [archetypes]);
  const traits = useMemo(() => buildRecordTraits(archetypes), [archetypes]);
  const badges = useMemo(() => selectRecordBadges(achievements), [achievements]);
  const stats = useMemo(() => buildRecordStats(statistics), [statistics]);
  const since = formatRecordSince(hero?.memberSince ?? user.createdAt);

  return (
    <View
      style={{ paddingHorizontal: theme.space('space.5'), paddingVertical: theme.space('space.5') }}
    >
      <View
        accessibilityRole="summary"
        accessibilityLabel={`Player record for ${user.displayName}, @${user.handle}`}
        style={{
          borderRadius: theme.radius('radius.xl'),
          overflow: 'hidden',
          padding: theme.space('space.5'),
          backgroundColor: theme.color('color.background.elevated'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
          gap: theme.space('space.5'),
        }}
      >
        <HatchOverlay />

        {/* §6: "accent notch in both corners". `CornerNotch` draws its mark at
            its own top-left, so the second one is the same component turned
            through half a turn and pinned to the opposite corner — one shape,
            two placements, rather than a mirrored variant of the primitive. */}
        <CornerNotch vertical />
        <CornerNotch
          vertical
          style={{
            top: undefined,
            left: undefined,
            bottom: 0,
            right: 0,
            transform: [{ rotate: '180deg' }],
          }}
        />

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text role="metaSm" color="color.text.tertiary">
            Player record
          </Text>
          {since !== null ? (
            <Text role="metaSm" color="color.text.tertiary">
              {`Since ${since}`}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.4') }}>
          {/* §6 asks for 56px; the scale steps 48 (`lg`) → 80 (`xl`), and 48 is
              much the nearer. The accent hairline is the ring the doc asks for —
              a line, never a fill. */}
          <Avatar
            size="lg"
            initials={userInitials(user.displayName)}
            uri={user.avatarUrl ?? undefined}
            priority="high"
            accessibilityLabel={`${user.displayName} avatar`}
            style={{
              borderWidth: 1,
              borderColor: theme.color('color.accent.default'),
            }}
          />

          <View style={{ flex: 1, gap: theme.space('space.2') }}>
            {/* 23px at weight 400 in the prototype; `title3` is the ramp's
                21/400 — nearest size at the exact weight. */}
            <Text role="title3" numberOfLines={1}>
              {user.displayName}
            </Text>
            <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
              @{user.handle}
            </Text>
          </View>
        </View>

        {primary !== null ? (
          <>
            <Divider />
            <View style={{ gap: theme.space('space.3') }}>
              <Text role="metaSm" color="color.text.tertiary">
                Archetype
              </Text>
              <Text role="title3">{primary.profile.title}</Text>
              <Text role="bodySm" color="color.text.secondary">
                {primary.profile.explanation}
              </Text>
              {traits.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: theme.space('space.2'),
                  }}
                >
                  {traits.map((trait) => (
                    <TraitPill key={trait.key} trait={trait} />
                  ))}
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {badges.length > 0 ? (
          <>
            <Divider />
            <View style={{ flexDirection: 'row', gap: theme.space('space.2') }}>
              {badges.map((badge) => (
                <BadgeSlot key={badge.achievement.id} badge={badge} onPress={onPressBadgeCase} />
              ))}
            </View>
          </>
        ) : null}

        {isPending && statistics === null ? (
          <>
            <Divider />
            <Skeleton shape="line" width="70%" />
          </>
        ) : stats.length > 0 ? (
          <>
            <Divider />
            <View style={{ flexDirection: 'row' }}>
              {stats.map((stat) => (
                <View key={stat.key} style={{ flex: 1, gap: theme.space('space.2') }}>
                  <Text role="title3" numberOfLines={1} adjustsFontSizeToFit>
                    {stat.value}
                  </Text>
                  <Text role="metaSm" color="color.text.tertiary" numberOfLines={1}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

/**
 * §6: "trait pills each carrying a value in accent monospace". Composed locally
 * rather than through `Chip` — `Chip` takes a single string child and fills when
 * selected, and this pill is a two-part label whose second part is the one place
 * on the card the accent is allowed to speak.
 */
function TraitPill({ trait }: { trait: RecordTrait }) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${trait.label}, score ${trait.value}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.2'),
        paddingHorizontal: theme.space('space.3'),
        paddingVertical: theme.space('space.1'),
        borderRadius: theme.radius('radius.full'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
      }}
    >
      <Text role="label" color="color.text.secondary">
        {trait.label}
      </Text>
      <Text role="meta" color="color.accent.default">
        {trait.value}
      </Text>
    </View>
  );
}

/**
 * One of the three equal-width badge slots. The plate is the shared rarity
 * table from 1.4 / 3.1 — radius, glow and border all come out of
 * `rarityGeometry`, so the slot ranks by shape and would still rank in
 * monochrome.
 *
 * Drawn at `RARITY_PLATE_MIN` (32) rather than §6's literal 30: below that floor
 * React Native clamps the radius ramp and the top two tiers stop separating,
 * which is the whole point of the plate.
 */
function BadgeSlot({ badge, onPress }: { badge: RecordBadge; onPress: () => void }) {
  const theme = useTheme();
  const { achievement, rarity } = badge;
  const plate = rarityGeometry(rarity);
  const rarityColor = theme.color(rarityColorToken(rarity));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title}, ${RARITY_LABELS[rarity]}. Opens the badge case.`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: MIN_TOUCH_TARGET,
        alignItems: 'center',
        gap: theme.space('space.2'),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: RARITY_PLATE_MIN,
          height: RARITY_PLATE_MIN,
          borderRadius: theme.radius(plate.radius),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: rarityColor,
          // Ambient, not a lift — the elevation token's downward offset is
          // dropped so the glow reads as rank rather than as a raised card.
          ...theme.elevation(plate.elevation),
          shadowColor: theme.color('color.accent.default'),
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <Trophy size={15} color={rarityColor} strokeWidth={1.75} />
      </View>

      <Text
        role="metaSm"
        color="color.text.tertiary"
        numberOfLines={2}
        style={{ textAlign: 'center' }}
      >
        {achievement.title}
      </Text>
    </Pressable>
  );
}

export const PlayerRecordCard = memo(PlayerRecordCardComponent);
