import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  SCREEN_GUTTER,
  ScreenTitle,
  Screen,
  SectionKicker,
  Skeleton,
  SkeletonBlock,
  Text,
  useTheme,
  useToast,
} from '@gmrlog/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';

import { FrontendApiError } from '../../../src/api/axios-client';
import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { AchievementPlate } from '../components/achievement-plate';
import { achievementTotals, buildShowcaseGroups } from '../hooks/achievement-showcase-model';
import {
  ACHIEVEMENT_PIN_LIMIT,
  moveEquippedBadge,
  selectEquippedAchievementIds,
} from '../hooks/badge-picker-model';
import {
  useEquipAchievementPin,
  useMeAchievements,
  useMePins,
  useUnequipAchievementPin,
} from '../hooks/use-profile-social';

function pinErrorMessage(error: unknown): string {
  if (error instanceof FrontendApiError) {
    return error.message;
  }
  return 'Something went wrong — try again.';
}

/**
 * Achievements (`SCREEN_REDESIGNS.md` §8) — its own screen, where it used to be
 * a section inside Profile.
 *
 * Two things about the composition are load-bearing for the twenty-three screens
 * that inherit from it. **The title belongs to the content:** it is the list's
 * header, so it scrolls away with the rows rather than sitting in a `NavHeader`
 * above them. And **every section opens with a kicker** — a tracked-out
 * monospace rule, never an 18px heading.
 *
 * Grouping, rarity and ordering all come from `achievement-showcase-model.ts`
 * unchanged; this task recomposes the surface, not the data.
 *
 * **9.5e** adds a picker mode — reached from `?mode=pick` (the record card's
 * "tap the badge case" affordance) or from the "Edit badges" toggle this task
 * adds to the header, so the mode is reachable even before any badge is
 * equipped, not only after. Only `useLocalSearchParams` seeds the initial
 * mode; once mounted the toggle owns it, same as any other screen-local mode
 * in this codebase (`customize-profile-screen.tsx`'s reorder controls) rather
 * than a route param round-trip on every tap.
 *
 * **Reordering is tap-based (`ChevronUp`/`ChevronDown` in the equipped tray),
 * not drag** — 6.3 already proved RNW's transform-animation bridge is dead on
 * web, and a picker that works on native and freezes on web isn't shippable.
 *
 * **Organisation accounts:** 9.5d gates equipping on `accountKind ===
 * 'individual'`, both at write and at read, but no `accountKind` field is
 * exposed to the frontend anywhere in this app (checked: it exists only in
 * `@gmrlog/database`'s Prisma model, never crosses a DTO). Inventing one here
 * would be backend scope this task's own brief rules out ("no further backend
 * work"), so the boundary this picker relies on is the server's own rejection
 * — already tested by 9.5d — surfaced verbatim through the toast below rather
 * than silently retried or guessed at client-side.
 */
export function AchievementsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const achievements = useMeAchievements();
  const pins = useMePins();
  const equipPin = useEquipAchievementPin();
  const unequipPin = useUnequipAchievementPin();

  const [picking, setPicking] = useState(() => params.mode === 'pick');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const groups = useMemo(() => buildShowcaseGroups(achievements.items), [achievements.items]);
  const totals = useMemo(() => achievementTotals(achievements.items), [achievements.items]);
  const achievementsById = useMemo(
    () => new Map(achievements.items.map((item) => [item.id, item] as const)),
    [achievements.items],
  );
  const equippedIds = useMemo(() => selectEquippedAchievementIds(pins.items), [pins.items]);

  const gutter = theme.space(SCREEN_GUTTER);

  async function handleToggle(achievementId: string): Promise<void> {
    if (pendingId !== null) {
      return;
    }
    const selected = equippedIds.includes(achievementId);
    if (!selected && equippedIds.length >= ACHIEVEMENT_PIN_LIMIT) {
      toast.show({
        message: `Only ${String(ACHIEVEMENT_PIN_LIMIT)} badges can be equipped at once — remove one first.`,
        tone: 'info',
      });
      return;
    }
    setPendingId(achievementId);
    try {
      if (selected) {
        await unequipPin.mutateAsync(achievementId);
      } else {
        await equipPin.mutateAsync({ achievementId, position: equippedIds.length });
      }
    } catch (error) {
      toast.show({ message: pinErrorMessage(error), tone: 'danger' });
    } finally {
      setPendingId(null);
    }
  }

  async function handleMove(achievementId: string, direction: 'up' | 'down'): Promise<void> {
    if (pendingId !== null) {
      return;
    }
    const reordered = moveEquippedBadge(equippedIds, achievementId, direction);
    const index = equippedIds.indexOf(achievementId);
    const targetIndex = reordered.indexOf(achievementId);
    const displacedId = equippedIds[targetIndex];
    if (index === targetIndex || displacedId === undefined) {
      return;
    }
    setPendingId(achievementId);
    try {
      await Promise.all([
        equipPin.mutateAsync({ achievementId, position: targetIndex }),
        equipPin.mutateAsync({ achievementId: displacedId, position: index }),
      ]);
    } catch (error) {
      toast.show({ message: pinErrorMessage(error), tone: 'danger' });
    } finally {
      setPendingId(null);
    }
  }

  async function handleClear(): Promise<void> {
    if (pendingId !== null || equippedIds.length === 0) {
      return;
    }
    setPendingId('__clear__');
    try {
      await Promise.all(equippedIds.map((id) => unequipPin.mutateAsync(id)));
    } catch (error) {
      toast.show({ message: pinErrorMessage(error), tone: 'danger' });
    } finally {
      setPendingId(null);
    }
  }

  const header = (
    <View>
      <ScreenTitle
        title="Achievements"
        backLabel="← Profile"
        onPressBack={() => {
          router.back();
        }}
        meta={`${totals.awarded.toLocaleString()} of ${totals.total.toLocaleString()} unlocked · ${String(totals.percent)}%`}
        progressValue={totals.awarded}
        progressTarget={totals.total}
        trailing={
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel={picking ? 'Done editing badges' : 'Edit equipped badges'}
            onPress={() => {
              setPicking((current) => !current);
            }}
          >
            {picking ? 'Done' : 'Edit badges'}
          </Button>
        }
      />
      {picking ? (
        <EquippedBadgeTray
          equippedIds={equippedIds}
          achievementsById={achievementsById}
          pendingId={pendingId}
          onMove={(achievementId, direction) => {
            void handleMove(achievementId, direction);
          }}
          onRemove={(achievementId) => {
            void handleToggle(achievementId);
          }}
          onClear={() => {
            void handleClear();
          }}
        />
      ) : null}
    </View>
  );

  if (achievements.isPending && achievements.items.length === 0) {
    return (
      <Screen edges={['top']}>
        {header}
        <SkeletonBlock
          accessibilityLabel="Loading achievements"
          style={{ paddingHorizontal: gutter, gap: theme.space('space.3') }}
        >
          <Skeleton shape="line" width="30%" />
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <Skeleton shape="rect" height={theme.space('space.16')} />
        </SkeletonBlock>
      </Screen>
    );
  }

  if (achievements.isError) {
    const mapped = mapAuthError(achievements.error, isOnline);
    return (
      <Screen edges={['top']}>
        {header}
        <ErrorState
          title={mapped.title}
          description={mapped.description}
          action={
            <Button
              variant="secondary"
              onPress={() => {
                void achievements.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <SectionList
        sections={groups.map((group) => ({ group, data: group.achievements }))}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <SectionKicker
            title={section.group.title}
            counter={`${String(section.group.awardedCount)}/${String(section.group.achievements.length)}`}
            style={{
              paddingHorizontal: gutter,
              paddingTop: theme.space('space.5'),
              paddingBottom: theme.space('space.3'),
            }}
          />
        )}
        renderItem={({ item }) => {
          const selected = equippedIds.includes(item.id);
          return (
            <View style={{ paddingHorizontal: gutter, paddingBottom: theme.space('space.2') }}>
              <AchievementPlate
                achievement={item}
                picker={
                  picking
                    ? {
                        selected,
                        order: selected ? equippedIds.indexOf(item.id) + 1 : null,
                        disabled: !selected && equippedIds.length >= ACHIEVEMENT_PIN_LIMIT,
                        onPress: () => {
                          void handleToggle(item.id);
                        },
                      }
                    : undefined
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No achievements yet"
            description="Log a game, write a review, or start a collection — badges unlock as you go."
            icon="trophy"
            fill
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={achievements.isRefreshing}
            onRefresh={() => {
              void achievements.refetch();
            }}
            tintColor={theme.color('color.interactive.primary')}
            colors={[theme.color('color.interactive.primary')]}
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: theme.space('space.8'), flexGrow: 1 }}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
    </Screen>
  );
}

/**
 * The equipped-badge tray — up to `ACHIEVEMENT_PIN_LIMIT` numbered rows with
 * tap-to-reorder controls, or an explanation of the automatic fallback when
 * nothing is equipped (9.5d: no equip is the default, not an error state).
 */
function EquippedBadgeTray({
  equippedIds,
  achievementsById,
  pendingId,
  onMove,
  onRemove,
  onClear,
}: {
  equippedIds: readonly string[];
  achievementsById: ReadonlyMap<string, { title: string }>;
  pendingId: string | null;
  onMove: (achievementId: string, direction: 'up' | 'down') => void;
  onRemove: (achievementId: string) => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  const gutter = theme.space(SCREEN_GUTTER);
  const busy = pendingId !== null;

  if (equippedIds.length === 0) {
    return (
      <View
        style={{
          paddingHorizontal: gutter,
          paddingBottom: theme.space('space.4'),
        }}
      >
        <Text role="bodySm" color="color.text.secondary">
          No badges equipped — your three strongest by rarity show automatically on your record
          card. Tap a badge below to equip it and take over that choice.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        paddingHorizontal: gutter,
        paddingBottom: theme.space('space.4'),
        gap: theme.space('space.2'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text role="metaSm" color="color.text.tertiary">
          {equippedIds.length} of {ACHIEVEMENT_PIN_LIMIT} equipped
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear equipped badges — show automatic selection"
          disabled={busy}
          onPress={onClear}
          hitSlop={8}
          style={{ opacity: busy ? 0.5 : 1 }}
        >
          <Text role="label" color="color.text.secondary">
            Clear — show automatic
          </Text>
        </Pressable>
      </View>

      {equippedIds.map((achievementId, index) => {
        const achievement = achievementsById.get(achievementId);
        if (achievement === undefined) {
          return null;
        }
        return (
          <View
            key={achievementId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space('space.2'),
              paddingVertical: theme.space('space.1'),
            }}
          >
            <Text
              role="label"
              color="color.accent.default"
              style={{ width: theme.space('space.5') }}
            >
              {index + 1}
            </Text>
            <Text role="bodySm" numberOfLines={1} style={{ flex: 1 }}>
              {achievement.title}
            </Text>
            <IconButton
              accessibilityLabel={`Move ${achievement.title} up`}
              size="sm"
              disabled={busy || index === 0}
              onPress={() => {
                onMove(achievementId, 'up');
              }}
            >
              <ChevronUp
                size={16}
                color={theme.color(
                  busy || index === 0 ? 'color.text.disabled' : 'color.text.secondary',
                )}
              />
            </IconButton>
            <IconButton
              accessibilityLabel={`Move ${achievement.title} down`}
              size="sm"
              disabled={busy || index === equippedIds.length - 1}
              onPress={() => {
                onMove(achievementId, 'down');
              }}
            >
              <ChevronDown
                size={16}
                color={theme.color(
                  busy || index === equippedIds.length - 1
                    ? 'color.text.disabled'
                    : 'color.text.secondary',
                )}
              />
            </IconButton>
            <IconButton
              accessibilityLabel={`Unequip ${achievement.title}`}
              size="sm"
              disabled={busy}
              onPress={() => {
                onRemove(achievementId);
              }}
            >
              <X
                size={16}
                color={theme.color(busy ? 'color.text.disabled' : 'color.text.secondary')}
              />
            </IconButton>
          </View>
        );
      })}
    </View>
  );
}
