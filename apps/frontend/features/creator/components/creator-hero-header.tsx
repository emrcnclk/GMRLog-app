import type { CreatorProfileResponse, UserPublicResponse } from '@gmrlog/types';
import { Avatar, HatchOverlay, Icon, Text, useTheme } from '@gmrlog/ui';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { userInitials } from '../../../shared/user/initials';
import { verifiedCreatorLabel } from '../hooks/creator-hub-model';

export interface CreatorHeroHeaderProps {
  user: UserPublicResponse;
  creator: CreatorProfileResponse | null;
  onBack: () => void;
}

/** §25's "132px gradient header". */
const HERO_HEIGHT = 132;
/** §25's "72px avatar overlapping by -34px". */
const AVATAR_SIZE = 72;
const AVATAR_OVERLAP = 34;
/** CLAUDE.md's tap-target floor, the glass back button's size. */
const GLASS_BUTTON_SIZE = 44;
const SEAL_SIZE = 20;

/**
 * `SCREEN_REDESIGNS_2.md` §25 — Creator hub header.
 *
 * **No gradient, no banner artwork — the same substitution 3b.10's
 * `TournamentHeader` already made for the identical "gradient header" ask.**
 * `UserPublicResponse` carries no image beyond `avatarUrl` — banner is
 * self-only (`UserSelfResponse`, `packages/types`), so unlike
 * `CommunityHeader` there is nothing for a legibility scrim to darken. Fill is
 * `color.background.elevated` with `color.accent.muted` as the hero's own
 * bottom edge; hatch stays, since it needs no artwork underneath it. Backend
 * follow-up: projecting `bannerUrl`/`bio` onto `UserPublicResponse` (both are
 * real `User` columns, just not exposed to non-self readers today) would let
 * this header carry real artwork and §25's one-line bio.
 *
 * **The since-year never gets fabricated.** See `verifiedCreatorLabel`'s doc
 * comment — `creatorBadge` is real, "since 2024" is not, so the line reads
 * "Verified creator" alone rather than inventing a date.
 */
export function CreatorHeroHeader({ user, creator, onBack }: CreatorHeroHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const verifiedLabel = verifiedCreatorLabel(creator);

  const glassForeground = theme.color('color.scrim.foreground');
  const glass = {
    width: GLASS_BUTTON_SIZE,
    height: GLASS_BUTTON_SIZE,
    borderRadius: theme.radius('radius.full'),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.color('color.scrim.strong'),
    borderWidth: 1,
    borderColor: theme.color('color.border.default'),
  };

  return (
    <View>
      <View
        style={{
          height: HERO_HEIGHT + insets.top,
          paddingTop: insets.top,
          backgroundColor: theme.color('color.background.elevated'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.accent.muted'),
          overflow: 'hidden',
        }}
      >
        <HatchOverlay opacity={0.045} />

        <View
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingTop: theme.space('space.3'),
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={glass}
          >
            <ChevronLeft size={20} color={glassForeground} strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: theme.space('space.5'),
          paddingBottom: theme.space('space.4'),
          gap: theme.space('space.3'),
        }}
      >
        <View
          style={{
            marginTop: -AVATAR_OVERLAP,
            width: AVATAR_SIZE + 6,
            height: AVATAR_SIZE + 6,
            borderRadius: theme.radius('radius.full'),
            borderWidth: 2,
            borderColor: theme.color('color.accent.default'),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.color('color.background.primary'),
          }}
        >
          <Avatar
            uri={user.avatarUrl ?? undefined}
            initials={userInitials(user.displayName)}
            sizeOverride={AVATAR_SIZE}
            accessibilityLabel={`${user.displayName} avatar`}
          />
        </View>

        <View style={{ gap: theme.space('space.1') }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.2') }}>
            <Text role="title2" color="color.text.primary" numberOfLines={2}>
              {user.displayName}
            </Text>
            {creator?.creatorBadge === true ? (
              <View
                accessibilityLabel="Verified creator"
                style={{
                  width: SEAL_SIZE,
                  height: SEAL_SIZE,
                  borderRadius: theme.radius('radius.full'),
                  borderWidth: 1,
                  borderColor: theme.color('color.accent.default'),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="check" decorative size={12} color="color.accent.default" />
              </View>
            ) : null}
          </View>

          <Text role="meta" color="color.text.tertiary">
            {verifiedLabel === null ? `@${user.handle}` : `@${user.handle} · ${verifiedLabel}`}
          </Text>

          {/* §25 also asks for a one-line bio at 14px/1.62 — `bio` is a real
              `User` column but `UserPublicResponse` doesn't project it for
              non-self readers (see this file's own doc comment). Omitted
              rather than left as empty furniture. */}
        </View>
      </View>
    </View>
  );
}
