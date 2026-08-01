import type { CollectionResponse, LibraryEntryResponse, ProfileHeroResponse } from '@gmrlog/types';
import { Badge, Text, useTheme } from '@gmrlog/ui';
import { Pressable, View } from 'react-native';

import {
  formatCompletionPercent,
  formatHeroArchetypes,
  formatMemberSince,
  formatSteamLevel,
  formatTotalHours,
  hasHeroContent,
  reputationBadgeLabel,
  resolveFavoriteTitles,
  resolveGameTitle,
  resolvePinnedCollectionTitle,
} from '../hooks/profile-hero-model';

export interface ProfileHeroPanelProps {
  hero: ProfileHeroResponse | null;
  isPending?: boolean;
  libraryEntries?: readonly LibraryEntryResponse[];
  collections?: readonly CollectionResponse[];
  onPressCollection?: (id: string) => void;
  onPressGame?: (id: string) => void;
}

interface HeroRowProps {
  label: string;
  value: string;
}

function HeroRow({ label, value }: HeroRowProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.space('space.3'),
        paddingVertical: theme.space('space.1'),
      }}
    >
      <Text role="caption" color="color.text.secondary">
        {label}
      </Text>
      <Text
        role="body"
        color="color.text.primary"
        style={{ flex: 1, textAlign: 'right' }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

/** D3.24 Profile Hero — player character at a glance. */
export function ProfileHeroPanel({
  hero,
  isPending = false,
  libraryEntries = [],
  collections = [],
  onPressCollection,
  onPressGame,
}: ProfileHeroPanelProps) {
  const theme = useTheme();

  if (isPending && !hero) {
    return (
      <View
        style={{ paddingHorizontal: theme.space('space.4'), paddingBottom: theme.space('space.3') }}
      >
        <Text role="meta" color="color.text.tertiary">
          Loading player hero…
        </Text>
      </View>
    );
  }

  if (!hero || !hasHeroContent(hero)) {
    return null;
  }

  const currentlyPlaying = resolveGameTitle(hero.currentlyPlayingGameId, libraryEntries);
  const favorites = resolveFavoriteTitles(hero.favoriteGameIds, libraryEntries);
  const pinnedCollection = resolvePinnedCollectionTitle(hero.pinnedCollectionId, collections);
  const archetypes = formatHeroArchetypes(hero.archetypeKeys);

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Profile hero"
      style={{
        marginHorizontal: theme.space('space.4'),
        marginBottom: theme.space('space.3'),
        padding: theme.space('space.3'),
        gap: theme.space('space.2'),
        borderRadius: theme.radius('radius.md'),
        borderWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.surface.secondary'),
      }}
    >
      <Text role="caption" color="color.text.secondary">
        Player Hero
      </Text>

      {currentlyPlaying ? <HeroRow label="Currently Playing" value={currentlyPlaying} /> : null}

      {favorites.length > 0 ? <HeroRow label="Favorites" value={favorites.join(', ')} /> : null}

      <HeroRow label="Steam Level" value={formatSteamLevel(hero.steamLevel)} />
      <HeroRow label="Completion" value={formatCompletionPercent(hero.completionPercent)} />
      <HeroRow label="Member Since" value={formatMemberSince(hero.memberSince)} />

      {hero.topGenre ? <HeroRow label="Top Genre" value={hero.topGenre} /> : null}
      {hero.totalHours !== null ? (
        <HeroRow label="Total Hours" value={formatTotalHours(hero.totalHours)} />
      ) : null}

      {archetypes.length > 0 ? <HeroRow label="Archetype" value={archetypes.join(' · ')} /> : null}

      {pinnedCollection ? <HeroRow label="Pinned Collection" value={pinnedCollection} /> : null}

      {(hero.reputationBadges.length > 0 || hero.creatorBadge) && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space('space.2'),
            paddingTop: theme.space('space.1'),
          }}
        >
          {hero.reputationBadges.map((badge) => (
            <Badge key={badge} tone="neutral">
              {reputationBadgeLabel(badge)}
            </Badge>
          ))}
          {hero.creatorBadge ? <Badge tone="neutral">Creator</Badge> : null}
        </View>
      )}

      {hero.pinnedCollectionId && onPressCollection ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open pinned collection"
          onPress={() => {
            if (hero.pinnedCollectionId) {
              onPressCollection(hero.pinnedCollectionId);
            }
          }}
        >
          <Text role="label" color="color.interactive.primary">
            Open pinned collection
          </Text>
        </Pressable>
      ) : null}

      {hero.currentlyPlayingGameId && onPressGame ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open currently playing game"
          onPress={() => {
            if (hero.currentlyPlayingGameId) {
              onPressGame(hero.currentlyPlayingGameId);
            }
          }}
        >
          <Text role="label" color="color.interactive.primary">
            Open currently playing game
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
