import type { LibraryEntryResponse } from '@gmrlog/types';
import {
  AspectBox,
  CornerNotch,
  GradientScrim,
  SCREEN_GUTTER,
  SectionKicker,
  Text,
  useTheme,
} from '@gmrlog/ui';
import { Trophy } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { selectPlayerCase } from '../../hooks/player-record-model';

export interface CompletedCaseProps {
  entries: readonly LibraryEntryResponse[];
  onPressGame: (gameId: string) => void;
}

/** §6's "98px covers". A cover width, not a spacing value — same class as `ASPECT`. */
const CASE_COVER_WIDTH = 98;

/**
 * §6's trophy shelf — "the only artwork in the app allowed a glow".
 *
 * The doc calls this the **Platinum case**, and since 13.1 it can be one: an
 * entry carrying a completion figure of 100 is a real claim of a full finish,
 * and those entries get the per-cover `100%` label §6 asks for. Until a player
 * has entered a figure the section falls back to the completed shelf under its
 * own honest name — `completed` is "finished it", not "finished it
 * completely", and deleting a player's finished games to show an empty
 * Platinum shelf would trade content for a label. `selectPlayerCase` decides
 * which is on screen; the trophy chip marks the section in both.
 *
 * Bleeds to both screen edges, per the shared "bleeding rail" pattern — the
 * overflow past the right edge is the point, so this never centres or pads
 * symmetrically.
 */
function CompletedCaseComponent({ entries, onPressGame }: CompletedCaseProps) {
  const theme = useTheme();
  const { mode, items } = useMemo(() => selectPlayerCase(entries), [entries]);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space('space.2'),
          paddingHorizontal: theme.space(SCREEN_GUTTER),
        }}
      >
        <Trophy size={13} color={theme.color('color.accent.default')} strokeWidth={1.75} />
        <SectionKicker
          title={mode === 'platinum' ? 'Platinum' : 'Completed'}
          counter={String(items.length)}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.space(SCREEN_GUTTER),
          gap: theme.space('space.3'),
        }}
      >
        {items.map((entry) => (
          <CaseCover
            key={entry.gameId}
            entry={entry}
            platinum={mode === 'platinum'}
            onPress={() => {
              onPressGame(entry.gameId);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function CaseCover({
  entry,
  platinum,
  onPress,
}: {
  entry: LibraryEntryResponse;
  platinum: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const finishedAt = formatCaseDate(entry.updatedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${entry.game.title}, ${platinum ? '100% complete' : 'completed'}${
        finishedAt === null ? '' : ` ${finishedAt}`
      }`}
      onPress={onPress}
      style={({ pressed }) => ({
        width: CASE_COVER_WIDTH,
        gap: theme.space('space.2'),
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          borderRadius: theme.radius('radius.md'),
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.color('color.accent.default'),
          // The one ambient glow the design law allows on artwork. Zero offset:
          // a lift would read as a card, and this is a trophy.
          ...theme.elevation('shadow.md'),
          shadowColor: theme.color('color.accent.default'),
          shadowOffset: { width: 0, height: 0 },
        }}
      >
        <AspectBox ratio="cover">
          {entry.game.coverUrl !== null ? (
            <CachedImage
              source={{ uri: entry.game.coverUrl }}
              priority="low"
              contentFit="cover"
              accessibilityIgnoresInvertColors
              style={{ width: '100%', height: '100%' }}
            />
          ) : null}
          <GradientScrim direction="to-top" intensity={0.7} />
        </AspectBox>

        <CornerNotch vertical />

        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            top: theme.space('space.2'),
            right: theme.space('space.2'),
            width: theme.space('space.5'),
            height: theme.space('space.5'),
            borderRadius: theme.radius('radius.sm'),
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.color('color.accent.default'),
            // `strong` is the panel and `foreground` the glyph on it — the same
            // pair `HeroBackButton` uses, and the reason the chip reads over
            // artwork in either scheme (a scrim is dark in both).
            backgroundColor: theme.color('color.scrim.strong'),
          }}
        >
          <Trophy size={11} color={theme.color('color.scrim.foreground')} strokeWidth={1.75} />
        </View>
      </View>

      <Text role="label" numberOfLines={1}>
        {entry.game.title}
      </Text>
      {/* §6's `100%` label, drawn only where it is true. The date keeps its
          place beside it rather than being replaced: "when" and "how far" are
          different facts and the case has room for both. */}
      {platinum || finishedAt !== null ? (
        <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
          {[platinum ? '100%' : null, finishedAt].filter((part) => part !== null).join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

function formatCaseDate(iso: string): string | null {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export const CompletedCase = memo(CompletedCaseComponent);
