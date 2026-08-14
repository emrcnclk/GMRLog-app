import type { SimilarUserResponse } from '@gmrlog/types';
import { Avatar, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import {
  DnaMatchToken,
  dnaMatchAccessibilityPhrase,
} from '../../dna-match/components/dna-match-token';

export interface SimilarUsersSectionProps {
  items: SimilarUserResponse[];
  isPending: boolean;
  onPressUser: (userId: string) => void;
}

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

function SimilarUsersSectionComponent({ items, isPending, onPressUser }: SimilarUsersSectionProps) {
  const theme = useTheme();

  if (isPending && items.length === 0) {
    return (
      <View
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.4'),
          paddingBottom: theme.space('space.2'),
          gap: theme.space('space.2'),
        }}
      >
        <Text role="title" color="color.text.primary">
          Similar players
        </Text>
        <Text role="body" color="color.text.secondary">
          Finding players with shared taste…
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View>
      <Text
        role="title"
        color="color.text.primary"
        style={{
          paddingHorizontal: theme.space('space.4'),
          paddingTop: theme.space('space.4'),
          paddingBottom: theme.space('space.2'),
        }}
      >
        Similar players
      </Text>
      {items.map((row) => (
        <Pressable
          key={row.user.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${row.user.displayName}${
            row.match ? `. ${dnaMatchAccessibilityPhrase(row.match)}` : ''
          }`}
          onPress={() => {
            onPressUser(row.user.id);
          }}
          style={{
            flexDirection: 'row',
            gap: theme.space('space.3'),
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
            minHeight: theme.space('space.16'),
            borderBottomWidth: 1,
            borderBottomColor: theme.color('color.border.default'),
            backgroundColor: theme.color('color.background.primary'),
            alignItems: 'center',
          }}
        >
          <Avatar
            uri={row.user.avatarUrl ?? undefined}
            initials={initialsFromDisplayName(row.user.displayName)}
            accessibilityLabel={`${row.user.displayName} avatar`}
          />
          <View style={{ flex: 1, gap: theme.space('space.1') }}>
            <Text role="label" color="color.text.primary" numberOfLines={1}>
              {row.user.displayName}
            </Text>
            <Text role="meta" color="color.text.secondary" numberOfLines={1}>
              @{row.user.handle}
            </Text>
            <DnaMatchToken match={row.match} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export const SimilarUsersSection = memo(SimilarUsersSectionComponent);
