import type {
  AchievementResponse,
  PlayerArchetypeResponse,
  ProfileHeroResponse,
  UserSelfResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import {
  ACCENT_KEYS,
  ACCENT_LABELS,
  Button,
  Chip,
  Divider,
  ErrorState,
  GradientScrim,
  HatchOverlay,
  Section,
  SCREEN_GUTTER,
  Screen,
  Skeleton,
  SkeletonBlock,
  Text,
  ThemeProvider,
  createThemeTokens,
  useTheme,
  type AccentKey,
} from '@gmrlog/ui';
import type { ProfileThemePatchInput } from '@gmrlog/validators';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Pin } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { mapAuthError } from '../../../src/auth/map-auth-error';
import { useConnectivityStore } from '../../../src/state/stores';
import { CustomizeProfileBar } from '../components/premium/customize-profile-bar';
import { PlayerRecordCard } from '../components/premium/player-record-card';
import {
  BANNER_STYLE_LABELS,
  CARD_STYLE_LABELS,
  CONSOLE_GENERATION_LABELS,
  FAVORITE_PLATFORM_OPTIONS,
  HERO_STYLE_LABELS,
  PROFILE_WIDGET_LABELS,
  type ConsoleGeneration,
  type ProfileBannerStyle,
  type ProfileCardStyle,
  type ProfileCustomization,
  type ProfileHeroStyle,
  type ProfileWidgetId,
} from '../hooks/profile-customization-model';
import { useProfile } from '../hooks/use-profile';
import { useProfileCustomization, useCustomizationStore } from '../hooks/use-profile-customization';
import { useProfileHero } from '../hooks/use-profile-hero';
import { useMeAchievements, useMeArchetypes, useMeStatistics } from '../hooks/use-profile-social';
import { usePatchProfileTheme, useProfileTheme } from '../hooks/use-profile-theme';

/** §18's card preview renders at a fraction of the record card's natural
 *  width — the same component, just smaller, never a mock. */
const PREVIEW_BASE_WIDTH = 340;
const PREVIEW_SCALE = 0.62;

/**
 * §18 — Customize profile. Editing surface for the fields D3.29 promoted from
 * device-local (`useProfileCustomization`) to synced (`/me/profile-theme`):
 * accent, card style, banner, favourite platform, console generation and
 * widget layout. `heroStyle` has no server column (`PROFILE_CUSTOMIZATION.md`
 * never listed it in the synced shape — it shipped after that contract, in
 * §6's variant switch) and stays device-local, edited here but saved through
 * the existing local store rather than the PATCH body.
 *
 * `cardStyle` and `bannerStyle` are real, saved preferences with no visual
 * consumer yet: `PlayerRecordCard` doesn't take either prop, so the live
 * preview reflects accent only. Not fabricated here — the picker tiles below
 * illustrate the choice on their own terms instead of pretending the card
 * already renders it.
 */
export function CustomizeProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isOnline = useConnectivityStore((s) => s.isOnline);

  const profile = useProfile();
  const heroUserId = profile.user?.id ?? '';
  const hero = useProfileHero(heroUserId);
  const statistics = useMeStatistics();
  const achievements = useMeAchievements();
  const archetypes = useMeArchetypes();

  const serverTheme = useProfileTheme();
  const localCustomization = useProfileCustomization();
  const patchTheme = usePatchProfileTheme();

  const [draft, setDraft] = useState<ProfileCustomization | null>(null);
  const [banner, setBanner] = useState<{ title: string; description: string } | null>(null);
  // Guards re-seeding, not a re-render dependency — a `ref` rather than state
  // so touching a control doesn't itself retrigger the effect below.
  const hasEditedRef = useRef(false);

  useEffect(() => {
    // Keeps tracking the query until the player's first edit, not just once
    // per mount: the persisted (offline) cache can rehydrate a stale value
    // synchronously before the live refetch resolves — seeding once and
    // never again would leave the draft stuck on that stale snapshot even
    // after the real one arrives. Once `hasEditedRef` flips, a background
    // refetch (e.g. the reconnect flush) stops clobbering in-progress edits.
    if (hasEditedRef.current || serverTheme.theme === null) {
      return;
    }
    setDraft({
      accent: serverTheme.theme.accent,
      cardStyle: serverTheme.theme.cardStyle,
      heroStyle: localCustomization.customization.heroStyle,
      bannerStyle: serverTheme.theme.bannerStyle,
      favoritePlatform: serverTheme.theme.favoritePlatform,
      consoleGeneration: serverTheme.theme.consoleGeneration,
      widgetOrder: serverTheme.theme.widgetOrder as ProfileWidgetId[],
      pinnedWidgets: serverTheme.theme.pinnedWidgets as ProfileWidgetId[],
      hiddenWidgets: serverTheme.theme.hiddenWidgets as ProfileWidgetId[],
    });
    // `localCustomization` is read for its current value, not watched —
    // heroStyle is device-local and doesn't need a theme refetch to change.
  }, [serverTheme.theme]);

  // This screen has exactly one entrance (Profile's Sparkles button), so
  // going there explicitly is simpler than depending on back-stack depth.
  // Unlike `onSave`, `Cancel` never touches `useCustomizationStore` — no
  // accent write, no remount, `router.back()` would have landed correctly
  // too; `replace` is used for both only for the two to read the same way.
  const onCancel = () => {
    router.replace('/profile');
  };

  const patch = (next: Partial<ProfileCustomization>) => {
    hasEditedRef.current = true;
    setDraft((current) => (current === null ? current : { ...current, ...next }));
  };

  const onSave = async () => {
    if (draft === null) {
      return;
    }
    setBanner(null);
    const body: ProfileThemePatchInput = {
      accent: draft.accent,
      cardStyle: draft.cardStyle,
      bannerStyle: draft.bannerStyle,
      favoritePlatform: draft.favoritePlatform,
      consoleGeneration: draft.consoleGeneration,
      widgetOrder: draft.widgetOrder,
      pinnedWidgets: draft.pinnedWidgets,
      hiddenWidgets: draft.hiddenWidgets,
    };
    try {
      const result = await patchTheme.mutateAsync(body);
      // Navigate *before* touching the local store: `AppThemeProvider`
      // (`src/theme/app-theme-provider.tsx`) keys its root `ThemeProvider` on
      // `accent`, so an accent write remounts the *entire navigator tree*,
      // not just the theme — the only way `ThemeProvider`'s uncontrolled
      // `initialAccent` picks up a change at all. Every earlier consumer of
      // this store (`useProfileCustomization`) was a modal sheet floating
      // over an already-mounted screen, so the remount was invisible; this
      // is the first *routed* screen to change accent, and it exposes the
      // cost: `router.replace('/profile')` before this write, after it, and
      // `router.back()` in either position all land on the tab navigator's
      // default (Home) instead of Profile once the accent write fires —
      // measured live, each combination tried. Root-caused, not fixed here:
      // the fix is in `AppThemeProvider`'s remount strategy, a root-level
      // change out of one screen's scope. The write itself is always
      // correct (confirmed via network response and a hard reload); only
      // the post-save landing screen is wrong, recoverable with one tap on
      // the Profile tab.
      useCustomizationStore.getState().patch({
        accent: result.value.accent,
        cardStyle: result.value.cardStyle,
        heroStyle: draft.heroStyle,
        bannerStyle: result.value.bannerStyle,
        favoritePlatform: result.value.favoritePlatform,
        consoleGeneration: result.value.consoleGeneration,
        widgetOrder: result.value.widgetOrder as ProfileWidgetId[],
        pinnedWidgets: result.value.pinnedWidgets as ProfileWidgetId[],
        hiddenWidgets: result.value.hiddenWidgets as ProfileWidgetId[],
      });
      router.replace('/profile');
    } catch (error) {
      // A real online failure — the draft survives so nothing typed is lost,
      // and the local store is untouched so a rejected save can't leak into
      // the rest of the app. Offline instead takes the try branch: the
      // durable queue in usePatchProfileTheme resolves rather than throwing.
      setBanner(mapAuthError(error, isOnline));
    }
  };

  if (profile.status === 'loading' || (serverTheme.isPending && draft === null)) {
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0 }}>
        <CustomizeProfileBar onCancel={onCancel} onSave={onCancel} saveDisabled saving={false} />
        <SkeletonBlock
          accessibilityLabel="Loading profile theme"
          style={{ padding: theme.space(SCREEN_GUTTER), gap: theme.space('space.4') }}
        >
          <Skeleton shape="rect" height={theme.space('space.24')} />
          <Skeleton shape="line" width="30%" />
          <Skeleton shape="rect" height={theme.space('space.10')} />
        </SkeletonBlock>
      </Screen>
    );
  }

  if (serverTheme.isError && draft === null) {
    const mapped = mapAuthError(serverTheme.error, isOnline);
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0 }}>
        <CustomizeProfileBar onCancel={onCancel} onSave={onCancel} saveDisabled saving={false} />
        <ErrorState
          title={mapped.title}
          description={mapped.description}
          action={
            <Button
              variant="secondary"
              onPress={() => {
                void serverTheme.refetch();
              }}
            >
              Try again
            </Button>
          }
        />
      </Screen>
    );
  }

  if (draft === null || profile.user === null) {
    return (
      <Screen edges={['bottom']} style={{ paddingTop: 0 }}>
        <CustomizeProfileBar onCancel={onCancel} onSave={onCancel} saveDisabled saving={false} />
      </Screen>
    );
  }

  const gutter = theme.space(SCREEN_GUTTER);

  return (
    <Screen edges={['bottom']} style={{ paddingTop: 0 }}>
      <CustomizeProfileBar
        onCancel={onCancel}
        onSave={() => {
          void onSave();
        }}
        saveDisabled={patchTheme.isPending}
        saving={patchTheme.isPending}
      />

      <View style={{ padding: gutter, gap: theme.space('space.6') }}>
        {banner ? <ErrorBannerBlock title={banner.title} description={banner.description} /> : null}

        <ThemeProvider initialPreference={theme.scheme} initialAccent={draft.accent}>
          <ScaledPlayerRecordCard
            user={profile.user}
            hero={hero.hero}
            statistics={statistics.statistics}
            archetypes={archetypes.items}
            achievements={achievements.items}
            isPending={statistics.isPending}
          />
        </ThemeProvider>

        <Section title="Accent">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.3') }}>
            {ACCENT_KEYS.map((key) => (
              <AccentSwatch
                key={key}
                accent={key}
                selected={draft.accent === key}
                onPress={() => {
                  patch({ accent: key });
                }}
              />
            ))}
          </View>
        </Section>

        <Section title="Card style">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.3') }}>
            {(Object.keys(CARD_STYLE_LABELS) as ProfileCardStyle[]).map((style) => (
              <CardStyleTile
                key={style}
                cardStyle={style}
                selected={draft.cardStyle === style}
                onPress={() => {
                  patch({ cardStyle: style });
                }}
              />
            ))}
          </View>
        </Section>

        <Section title="Banner">
          <View style={{ gap: theme.space('space.2') }}>
            {(Object.keys(BANNER_STYLE_LABELS) as ProfileBannerStyle[]).map((style) => (
              <BannerStyleRow
                key={style}
                bannerStyle={style}
                selected={draft.bannerStyle === style}
                onPress={() => {
                  patch({ bannerStyle: style });
                }}
              />
            ))}
          </View>
        </Section>

        <Divider />

        <Section title="Hero" description="The record card, or one of the two alternates.">
          <OptionRow
            options={Object.keys(HERO_STYLE_LABELS) as ProfileHeroStyle[]}
            labels={HERO_STYLE_LABELS}
            selected={draft.heroStyle}
            onSelect={(heroStyle) => {
              patch({ heroStyle });
            }}
          />
        </Section>

        {FAVORITE_PLATFORM_OPTIONS.length > 0 ? (
          <Section title="Favourite platform">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
              {FAVORITE_PLATFORM_OPTIONS.map((platform) => (
                <Chip
                  key={platform}
                  selected={draft.favoritePlatform === platform}
                  accessibilityLabel={`Favourite platform ${platform}`}
                  onPress={() => {
                    patch({
                      favoritePlatform: draft.favoritePlatform === platform ? null : platform,
                    });
                  }}
                >
                  {platform}
                </Chip>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="Console generation">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {(Object.keys(CONSOLE_GENERATION_LABELS) as ConsoleGeneration[]).map((generation) => (
              <Chip
                key={generation}
                selected={draft.consoleGeneration === generation}
                accessibilityLabel={CONSOLE_GENERATION_LABELS[generation]}
                onPress={() => {
                  patch({
                    consoleGeneration: draft.consoleGeneration === generation ? null : generation,
                  });
                }}
              >
                {CONSOLE_GENERATION_LABELS[generation]}
              </Chip>
            ))}
          </View>
        </Section>

        <Divider />

        <Section title="Widgets" description="Reorder, pin to the top, or hide entirely.">
          <View>
            {draft.widgetOrder.map((id, index) => (
              <WidgetRow
                key={id}
                id={id}
                index={index}
                total={draft.widgetOrder.length}
                pinned={draft.pinnedWidgets.includes(id)}
                hidden={draft.hiddenWidgets.includes(id)}
                onMove={(widgetId, direction) => {
                  const order = [...draft.widgetOrder];
                  const from = order.indexOf(widgetId);
                  const to = direction === 'up' ? from - 1 : from + 1;
                  if (from === -1 || to < 0 || to >= order.length) {
                    return;
                  }
                  const moved = order[from];
                  const displaced = order[to];
                  if (moved === undefined || displaced === undefined) {
                    return;
                  }
                  order[from] = displaced;
                  order[to] = moved;
                  patch({ widgetOrder: order });
                }}
                onTogglePinned={(widgetId) => {
                  patch({
                    pinnedWidgets: draft.pinnedWidgets.includes(widgetId)
                      ? draft.pinnedWidgets.filter((w) => w !== widgetId)
                      : [...draft.pinnedWidgets, widgetId],
                  });
                }}
                onToggleHidden={(widgetId) => {
                  patch({
                    hiddenWidgets: draft.hiddenWidgets.includes(widgetId)
                      ? draft.hiddenWidgets.filter((w) => w !== widgetId)
                      : [...draft.hiddenWidgets, widgetId],
                  });
                }}
              />
            ))}
          </View>
        </Section>

        {/* §18's footer links through to the cosmetics store (3b.7). That
            screen doesn't exist yet — omitted rather than pointing at a
            route that would 404, per the dead-route class this session
            already found and fixed once. */}
      </View>
    </Screen>
  );
}

function ErrorBannerBlock({ title, description }: { title: string; description: string }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{
        borderWidth: 1,
        borderColor: theme.color('color.status.error'),
        borderRadius: theme.radius('radius.md'),
        padding: theme.space('space.3'),
        gap: theme.space('space.1'),
      }}
    >
      <Text role="label" color="color.status.error">
        {title}
      </Text>
      <Text role="bodySm" color="color.text.secondary">
        {description}
      </Text>
    </View>
  );
}

interface ScaledPlayerRecordCardProps {
  user: UserSelfResponse;
  hero: ProfileHeroResponse | null;
  statistics: UserStatisticsResponse | null;
  archetypes: readonly PlayerArchetypeResponse[];
  achievements: readonly AchievementResponse[];
  isPending: boolean;
}

/** §18: "the player record card at reduced size" — the real component,
 *  scaled from its own top-left rather than cropped or rebuilt as a mock. */
function ScaledPlayerRecordCard({
  user,
  hero,
  statistics,
  archetypes,
  achievements,
  isPending,
}: ScaledPlayerRecordCardProps) {
  const [height, setHeight] = useState<number | null>(null);
  const translateX = -(PREVIEW_BASE_WIDTH * (1 - PREVIEW_SCALE)) / 2;
  const translateY = height !== null ? -(height * (1 - PREVIEW_SCALE)) / 2 : 0;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignSelf: 'center',
        width: PREVIEW_BASE_WIDTH * PREVIEW_SCALE,
        height: height !== null ? height * PREVIEW_SCALE : undefined,
        overflow: 'hidden',
        opacity: height !== null ? 1 : 0,
      }}
    >
      <View
        style={{
          width: PREVIEW_BASE_WIDTH,
          transform: [{ translateX }, { translateY }, { scale: PREVIEW_SCALE }],
        }}
        onLayout={(event) => {
          const measured = event.nativeEvent.layout.height;
          setHeight((current) => (current === measured ? current : measured));
        }}
      >
        <PlayerRecordCard
          user={user}
          hero={hero}
          statistics={statistics}
          archetypes={archetypes}
          achievements={achievements}
          isPending={isPending}
          onPressBadgeCase={() => {
            // Decorative preview — badges aren't tappable here.
          }}
        />
      </View>
    </View>
  );
}

/** Preview swatch pulled from the real token pipeline for the active scheme,
 *  so the circle always matches what selecting it will produce. */
function AccentSwatch({
  accent,
  selected,
  onPress,
}: {
  accent: AccentKey;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const preview = createThemeTokens(theme.scheme, accent).color['color.accent.default'];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      // `accessibilityState` does not reach the DOM on a web `Pressable`
      // (CLAUDE.md's documented RNW trap) — the state is said in the label too.
      accessibilityLabel={`${ACCENT_LABELS[accent]} accent${selected ? ', selected' : ''}`}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space('space.1'),
      }}
    >
      <View
        style={{
          width: theme.space('space.10'),
          height: theme.space('space.10'),
          borderRadius: theme.radius('radius.full'),
          backgroundColor: preview,
          borderWidth: selected ? 3 : 1,
          borderColor: selected
            ? theme.color('color.text.primary')
            : theme.color('color.border.default'),
          // §18's 4px halo — a ring outside the swatch, not a filled glow.
          ...(selected
            ? {
                shadowColor: theme.color('color.text.primary'),
                shadowOpacity: 0.35,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              }
            : null),
        }}
      />
      <Text role="meta" color={selected ? 'color.text.primary' : 'color.text.tertiary'}>
        {ACCENT_LABELS[accent]}
      </Text>
    </Pressable>
  );
}

/**
 * §18's 3-column 52px card-style tile. No style is Pro-gated today —
 * `ProfileCardStyle` carries no ownership concept, so the diamond icon the
 * doc asks for on locked styles is omitted rather than fabricated on all
 * three (3b.7's cosmetics store is where that data would come from).
 */
function CardStyleTile({
  cardStyle,
  selected,
  onPress,
}: {
  cardStyle: ProfileCardStyle;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  const tileStyle = (() => {
    switch (cardStyle) {
      case 'elevated':
        return {
          backgroundColor: theme.color('color.background.elevated'),
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
        };
      case 'flat':
        return {
          backgroundColor: theme.color('color.surface.secondary'),
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.color('color.border.default'),
        };
      default: {
        const _exhaustive: never = cardStyle;
        return _exhaustive;
      }
    }
  })();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${CARD_STYLE_LABELS[cardStyle]} card style${selected ? ', selected' : ''}`}
      onPress={onPress}
      style={{ width: theme.space('space.16'), alignItems: 'center', gap: theme.space('space.1') }}
    >
      <View
        style={[
          {
            width: theme.space('space.12'),
            height: theme.space('space.12'),
            borderRadius: theme.radius('radius.md'),
          },
          tileStyle,
          selected
            ? {
                borderColor: theme.color('color.accent.default'),
                borderWidth: 2,
              }
            : null,
        ]}
      />
      <Text role="meta" color={selected ? 'color.text.primary' : 'color.text.tertiary'}>
        {CARD_STYLE_LABELS[cardStyle]}
      </Text>
    </Pressable>
  );
}

/**
 * §18's full-width banner preview row. Reuses the exact primitives the real
 * banner treatments render with (`GradientScrim`, `HatchOverlay`) rather than
 * inventing a second illustration language. No banner is locked or animated
 * today — those flags don't exist on `ProfileBannerStyle`, so the price pill
 * and pulsing dot the doc describes for that state are omitted, not faked.
 */
function BannerStyleRow({
  bannerStyle,
  selected,
  onPress,
}: {
  bannerStyle: ProfileBannerStyle;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${BANNER_STYLE_LABELS[bannerStyle]} banner${selected ? ', selected' : ''}`}
      onPress={onPress}
      style={{ gap: theme.space('space.1') }}
    >
      <View
        style={{
          height: theme.space('space.16'),
          borderRadius: theme.radius('radius.md'),
          overflow: 'hidden',
          backgroundColor:
            bannerStyle === 'solid'
              ? theme.color('color.accent.muted')
              : theme.color('color.background.secondary'),
          borderWidth: selected ? 2 : 1,
          borderColor: selected
            ? theme.color('color.accent.default')
            : theme.color('color.border.default'),
        }}
      >
        {bannerStyle === 'artwork' ? <HatchOverlay /> : null}
        {bannerStyle === 'gradient' ? <GradientScrim direction="to-top" intensity={0.5} /> : null}
      </View>
      <Text role="meta" color={selected ? 'color.text.primary' : 'color.text.tertiary'}>
        {BANNER_STYLE_LABELS[bannerStyle]}
      </Text>
    </Pressable>
  );
}

function OptionRow<T extends string>({
  options,
  labels,
  selected,
  onSelect,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
      {options.map((option) => (
        <Chip
          key={option}
          selected={selected === option}
          accessibilityLabel={labels[option]}
          onPress={() => {
            onSelect(option);
          }}
        >
          {labels[option]}
        </Chip>
      ))}
    </View>
  );
}

function WidgetRow({
  id,
  index,
  total,
  pinned,
  hidden,
  onMove,
  onTogglePinned,
  onToggleHidden,
}: {
  id: ProfileWidgetId;
  index: number;
  total: number;
  pinned: boolean;
  hidden: boolean;
  onMove: (id: ProfileWidgetId, direction: 'up' | 'down') => void;
  onTogglePinned: (id: ProfileWidgetId) => void;
  onToggleHidden: (id: ProfileWidgetId) => void;
}) {
  const theme = useTheme();
  const label = PROFILE_WIDGET_LABELS[id];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space('space.2'),
        paddingVertical: theme.space('space.2'),
        borderBottomWidth: 1,
        borderBottomColor: theme.color('color.border.default'),
        opacity: hidden ? 0.5 : 1,
      }}
    >
      <GripVertical size={18} color={theme.color('color.text.tertiary')} />

      <Text role="label" style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Text>

      <IconAction
        label={`Move ${label} up`}
        disabled={index === 0}
        onPress={() => {
          onMove(id, 'up');
        }}
      >
        <ChevronUp
          size={18}
          color={theme.color(index === 0 ? 'color.text.disabled' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={`Move ${label} down`}
        disabled={index === total - 1}
        onPress={() => {
          onMove(id, 'down');
        }}
      >
        <ChevronDown
          size={18}
          color={theme.color(index === total - 1 ? 'color.text.disabled' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={pinned ? `Unpin ${label}` : `Pin ${label}`}
        selected={pinned}
        onPress={() => {
          onTogglePinned(id);
        }}
      >
        <Pin
          size={18}
          color={theme.color(pinned ? 'color.accent.default' : 'color.text.secondary')}
        />
      </IconAction>

      <IconAction
        label={hidden ? `Show ${label}` : `Hide ${label}`}
        selected={hidden}
        onPress={() => {
          onToggleHidden(id);
        }}
      >
        {hidden ? (
          <EyeOff size={18} color={theme.color('color.text.tertiary')} />
        ) : (
          <Eye size={18} color={theme.color('color.text.secondary')} />
        )}
      </IconAction>
    </View>
  );
}

function IconAction({
  label,
  onPress,
  disabled = false,
  selected = false,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}
