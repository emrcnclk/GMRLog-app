import type { SimilarUserResponse } from '@gmrlog/types';
import { Avatar, Divider, Text, pressableMotionStyle, useReduceMotion, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { DnaMatchRing } from '../../dna-match/components/dna-match-ring';

export interface DnaPeerCardProps {
  peer: SimilarUserResponse;
  onPress: (userId: string) => void;
}

/** README §"Discover — Plays like you rail": 136px card, 52px ringed avatar. */
export const DNA_PEER_CARD_WIDTH = 136;
const AVATAR_SIZE = 52;
export const DNA_PEER_RING_SIZE = 60;

function initialsFromDisplayName(displayName: string): string {
  const [first, second] = displayName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (first === undefined) {
    return '?';
  }
  if (second === undefined) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
}

/**
 * One "Plays like you" tile — the card treatment `README.md` describes over
 * data `useSimilarUsers` already fetches. `score` is the same weighted total
 * that will become `match.percent` once 5.3 ships (`BACKEND_CHANGES.md` §3);
 * rendering `Math.round(score * 100)` today is formatting an existing
 * server-computed value, not deriving a second one.
 */
function DnaPeerCardComponent({ peer, onPress }: DnaPeerCardProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const percent = Math.round(peer.score * 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${String(percent)} percent DNA match with ${peer.user.displayName}`}
      onPress={() => {
        onPress(peer.user.id);
      }}
      style={({ pressed }) => [
        { width: DNA_PEER_CARD_WIDTH, alignItems: 'center', gap: theme.space('space.2') },
        pressableMotionStyle(pressed, reduceMotion),
      ]}
    >
      <View
        style={{
          width: DNA_PEER_RING_SIZE,
          height: DNA_PEER_RING_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute' }}>
          <DnaMatchRing percent={percent} size={DNA_PEER_RING_SIZE} />
        </View>
        <Avatar
          uri={peer.user.avatarUrl ?? undefined}
          initials={initialsFromDisplayName(peer.user.displayName)}
          sizeOverride={AVATAR_SIZE}
          accessibilityLabel={`${peer.user.displayName} avatar`}
        />
      </View>

      <View style={{ alignItems: 'center', gap: theme.space('space.1') }}>
        <Text role="label" numberOfLines={1} style={{ textAlign: 'center' }}>
          {peer.user.displayName}
        </Text>
        <Text role="meta" color="color.text.tertiary" numberOfLines={1}>
          @{peer.user.handle}
        </Text>
      </View>

      <Divider />

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: theme.space('space.1') }}>
        <Text role="title2">{percent}%</Text>
        <Text role="metaSm" color="color.text.tertiary" style={{ paddingBottom: 2 }}>
          match
        </Text>
      </View>
    </Pressable>
  );
}

export const DnaPeerCard = memo(DnaPeerCardComponent);
