import type { GameHubResponse } from '@gmrlog/types';
import { Button, Screen, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SimilarGamesSection } from '../../discover/components/similar-games-section';
import { useSimilarGames } from '../../discover/hooks/use-discover';
import { formatHubTabLabel, GAME_HUB_TABS, gameHubTabPath } from '../hooks/game-hub-model';
import { useGameHub } from '../hooks/use-game-hub';

export interface GameHubScreenProps {
  gameId: string;
}

/** Game Hub — summary + tab navigation (D3.24 GAME_HUB.md). */
export function GameHubScreen({ gameId }: GameHubScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hit = theme.space('space.12');
  const similar = useSimilarGames(gameId);
  const { hub, isPending } = useGameHub(gameId);
  const title = hub?.title ?? (isPending ? 'Game' : 'Game');
  const counts = hub?.tabCounts;

  return (
    <Screen edges={['left', 'right', 'bottom']} style={{ paddingTop: 0, paddingBottom: 0 }}>
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
          paddingHorizontal: theme.space('space.4'),
          minHeight: hit + insets.top,
          justifyContent: 'center',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            router.back();
          }}
          hitSlop={8}
          style={{ minHeight: hit, justifyContent: 'center' }}
        >
          <Text role="label" color="color.interactive.primary">
            Back
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: theme.space('space.8') }}>
        <View style={{ padding: theme.space('space.4'), gap: theme.space('space.5') }}>
          <View style={{ gap: theme.space('space.2') }}>
            <Text role="heading">{title}</Text>
            <Text role="meta" color="color.text.tertiary">
              id: {gameId}
            </Text>
            {counts != null ? (
              <Text role="body" color="color.text.secondary">
                {formatHubTabSummary(counts)}
              </Text>
            ) : (
              <Text role="body" color="color.text.secondary">
                {isPending ? 'Loading hub…' : 'Explore community writing below.'}
              </Text>
            )}
          </View>

          {GAME_HUB_TABS.map((tab) => (
            <Button
              key={tab.key}
              variant="secondary"
              accessibilityLabel={`Open ${tab.label.toLowerCase()}`}
              onPress={() => {
                router.push(gameHubTabPath(gameId, tab.routeSuffix));
              }}
            >
              {formatHubTabLabel(
                tab.label,
                tab.countKey && counts ? counts[tab.countKey] : undefined,
              )}
            </Button>
          ))}

          <Button
            variant="primary"
            accessibilityLabel="Write a review"
            onPress={() => {
              router.push({
                pathname: '/(app)/review/create',
                params: { gameId },
              });
            }}
          >
            Write a review
          </Button>
          <Button
            variant="primary"
            accessibilityLabel="Write a post"
            onPress={() => {
              router.push({
                pathname: '/(app)/post/create',
                params: { gameId },
              });
            }}
          >
            Write a post
          </Button>

          <SimilarGamesSection
            items={similar.items}
            isPending={similar.isPending}
            onPressGame={(id) => {
              router.push(`/(app)/game/${id}`);
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatHubTabSummary(counts: GameHubResponse['tabCounts']): string {
  return GAME_HUB_TABS.flatMap((tab) =>
    tab.countKey === undefined ? [] : [formatHubTabLabel(tab.label, counts[tab.countKey])],
  ).join(' · ');
}
