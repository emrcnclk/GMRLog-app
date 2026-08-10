import type { CommunityLeaderboardEntry } from '@gmrlog/types';
import { Avatar, ProgressBar, SectionKicker, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { initialsFromName } from '../hooks/community-model';
import type { ListViewModel } from '../hooks/community-model';

export interface ContributionBoardProps {
  leaderboard: ListViewModel<CommunityLeaderboardEntry>;
}

const ROW_AVATAR_SIZE = 26;

/**
 * README §2b — top 5 by 90-day contribution points. Points are backend-owned
 * (7.1's `leaderboard.engine.ts`); this only renders the ranked rows.
 *
 * Only the `ready` view renders. A pending or errored fetch stays silent
 * rather than adding a skeleton or an error banner nobody asked for — this is
 * a secondary section next to the member list, not the screen's own state
 * machine. `empty` is a real, expected case, not a gap to explain: 7.1
 * measured every baseline circle's leaderboard as `entries: []` since none
 * carry real posts/replies/hosted events yet, so the section simply omits
 * itself rather than showing a board with nothing on it.
 */
function ContributionBoardComponent({ leaderboard }: ContributionBoardProps) {
  const theme = useTheme();

  if (leaderboard.status !== 'ready') {
    return null;
  }

  const entries = leaderboard.items;
  const leaderPoints = entries[0]?.points ?? 0;

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <SectionKicker title="Contribution board" counter="90 days" />
      </View>
      <View>
        {entries.map((entry) => (
          <View
            key={entry.user.id}
            accessibilityRole="summary"
            accessibilityLabel={`Rank ${String(entry.rank)}, ${entry.user.displayName}, ${String(entry.points)} points`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space('space.3'),
              paddingHorizontal: theme.space('space.4'),
              paddingVertical: theme.space('space.2'),
              borderBottomWidth: 1,
              borderBottomColor: theme.color('color.border.default'),
            }}
          >
            <Text
              role="meta"
              color={entry.rank === 1 ? 'color.accent.default' : 'color.text.tertiary'}
              style={{ width: theme.space('space.5') }}
            >
              {String(entry.rank).padStart(2, '0')}
            </Text>
            <Avatar
              sizeOverride={ROW_AVATAR_SIZE}
              uri={entry.user.avatarUrl ?? undefined}
              initials={initialsFromName(entry.user.displayName)}
              accessibilityLabel={`${entry.user.displayName} avatar`}
            />
            <View style={{ flex: 1, gap: theme.space('space.1') }}>
              <Text role="label" color="color.text.primary" numberOfLines={1}>
                {entry.user.displayName}
              </Text>
              <ProgressBar
                value={entry.points}
                target={leaderPoints}
                height={2}
                accessibilityLabel={`${String(entry.points)} of ${String(leaderPoints)} points`}
              />
            </View>
            <Text role="meta" color="color.text.primary">
              {entry.points}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const ContributionBoard = memo(ContributionBoardComponent);
