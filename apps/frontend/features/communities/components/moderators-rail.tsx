import type { CommunityMemberResponse } from '@gmrlog/types';
import { Avatar, Card, Rail, Text, useTheme } from '@gmrlog/ui';
import { memo, useMemo } from 'react';

import { initialsFromName, isModeratorRole, roleLabel } from '../hooks/community-model';

export interface ModeratorsRailProps {
  members: CommunityMemberResponse[];
}

const PLATE_WIDTH = 138;
const PLATE_AVATAR_SIZE = 38;

/**
 * README §2a — a plate for every moderator-and-above member, plus every plain
 * member `isContributor` (7.1) marks as top-10 by points. Moderator+ gets an
 * accent border and an ambient glow; a contributor-only plate gets a plain
 * hairline and no glow — the same with/without-glow language `RarityBadge`
 * uses to mark rank by geometry rather than by a second hue. The doc's own
 * "reuse `rarityColorToken`" is read as that technique, not the literal call:
 * that helper takes a `RarityTier`, and a community role is not one.
 */
function ModeratorsRailComponent({ members }: ModeratorsRailProps) {
  const theme = useTheme();

  const plates = useMemo(
    () =>
      members
        .filter((member) => isModeratorRole(member.role) || member.isContributor === true)
        .sort((a, b) => {
          const modDelta = Number(isModeratorRole(b.role)) - Number(isModeratorRole(a.role));
          if (modDelta !== 0) {
            return modDelta;
          }
          return a.user.displayName.localeCompare(b.user.displayName);
        }),
    [members],
  );

  if (plates.length === 0) {
    return null;
  }

  const accent = theme.color('color.accent.default');
  const glowLift = theme.elevation('shadow.sm');

  return (
    <Rail title="Moderators & contributors">
      {plates.map((member) => {
        const isMod = isModeratorRole(member.role);
        const roleText = isMod ? roleLabel(member.role) : 'Contributor';

        return (
          <Card
            key={member.user.id}
            accessibilityRole="summary"
            accessibilityLabel={`${member.user.displayName}, ${roleText}`}
            style={{
              width: PLATE_WIDTH,
              gap: theme.space('space.2'),
              borderRadius: theme.radius('radius.sm'),
              borderColor: isMod ? accent : theme.color('color.border.default'),
              ...(isMod
                ? { ...glowLift, shadowColor: accent, shadowOffset: { width: 0, height: 0 } }
                : null),
            }}
          >
            <Avatar
              sizeOverride={PLATE_AVATAR_SIZE}
              uri={member.user.avatarUrl ?? undefined}
              initials={initialsFromName(member.user.displayName)}
              accessibilityLabel={`${member.user.displayName} avatar`}
            />
            <Text role="label" color="color.text.primary" numberOfLines={1}>
              {member.user.displayName}
            </Text>
            <Text role="meta" color="color.accent.default" numberOfLines={1}>
              {roleText}
            </Text>
          </Card>
        );
      })}
    </Rail>
  );
}

export const ModeratorsRail = memo(ModeratorsRailComponent);
