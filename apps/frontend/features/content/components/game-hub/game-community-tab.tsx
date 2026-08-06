import type {
  FeedItemResponse,
  GameHubCollectionSummaryResponse,
  OnlineFriendResponse,
} from '@gmrlog/types';
import { AspectBox, EmptyState, ListItem, Skeleton, Text, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

import { CachedImage } from '../../../../src/assets/cached-image';
import { PresenceRail } from '../../../messages/components/presence-rail';

import { GameActivityRow } from './game-activity-row';

export interface GameCommunityTabProps {
  gameTitle: string;
  onlineFriendsPlaying: OnlineFriendResponse[];
  isFriendsPending: boolean;
  onPressFriend: (userId: string) => void;
  collections: readonly GameHubCollectionSummaryResponse[];
  isCollectionsPending: boolean;
  onPressCollection: (collectionId: string) => void;
  activity: readonly FeedItemResponse[];
  isActivityPending: boolean;
  onPressGame: (gameId: string) => void;
  onPressUser: (userId: string) => void;
}

const LIVE_NOW_LIMIT = 5;

/**
 * Community (§5) — four stacked sections in the doc: Friends playing, Popular
 * clips, Top collections, Live now. Built three of the four:
 *
 * - **Friends playing** reuses `PresenceRail` (§11) unmodified, fed a real
 *   client-side intersection (`selectOnlineFriendsPlaying`) of the viewer's
 *   online friends against this game's real player list — genuine presence
 *   data, not an invented pulse. RNW's `Animated.timing` doesn't advance on
 *   this build (3.2's Toggle finding), so the dot is the same static circle
 *   `PresenceRail` already ships, not the doc's literal "pulsing" one.
 * - **Top collections** is a row per real `GameHubCollectionSummaryResponse`
 *   — that projection carries one `coverUrl`, not the four the full
 *   `CollectionResponse` mosaic needs, so this is a cover-thumbnail row, not
 *   a 4-strip mosaic. **Backend follow-up:** the game-hub collections
 *   endpoint would need the same multi-cover projection `CollectionResponse`
 *   already has before a real mosaic can render here.
 * - **Live now** reuses the existing `GameActivityRow` (this game's own
 *   activity feed), capped rather than the doc's compact "dot + one line" —
 *   the shorter row doesn't exist as a component yet and this screen already
 *   has enough new primitives; reusing the tested row over building a new
 *   compact variant.
 *
 * **Popular clips is not built.** `GameMediaResponse` carries no duration or
 * popularity signal — there is nothing to rank by and no runtime to show.
 * **Backend follow-up, tracked in TASKS.md** the same shape as every other
 * gap this phase has found.
 */
function GameCommunityTabComponent({
  gameTitle,
  onlineFriendsPlaying,
  isFriendsPending,
  onPressFriend,
  collections,
  isCollectionsPending,
  onPressCollection,
  activity,
  isActivityPending,
  onPressGame,
  onPressUser,
}: GameCommunityTabProps) {
  const theme = useTheme();
  const liveNow = activity.slice(0, LIVE_NOW_LIMIT);
  const nothingYet =
    !isFriendsPending &&
    !isCollectionsPending &&
    !isActivityPending &&
    onlineFriendsPlaying.length === 0 &&
    collections.length === 0 &&
    liveNow.length === 0;

  return (
    <View style={{ gap: theme.space('space.6'), paddingBottom: theme.space('space.6') }}>
      {isFriendsPending && onlineFriendsPlaying.length === 0 ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <Skeleton shape="rect" height={theme.space('space.20')} />
        </View>
      ) : (
        <PresenceRail
          title="Friends playing"
          friends={onlineFriendsPlaying}
          onPressFriend={onPressFriend}
        />
      )}

      {collections.length > 0 ? (
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="title" style={{ paddingHorizontal: theme.space('space.4') }}>
            Top collections
          </Text>
          <View>
            {collections.map((collection) => (
              <ListItem
                key={collection.id}
                title={collection.title}
                subtitle={`Curated by ${collection.owner.displayName}`}
                accessibilityLabel={`${collection.title}, curated by ${collection.owner.displayName}`}
                leading={
                  <AspectBox ratio="square" radius="radius.md" style={{ width: 40 }}>
                    {collection.coverUrl !== null ? (
                      <CachedImage
                        source={{ uri: collection.coverUrl }}
                        contentFit="cover"
                        accessibilityIgnoresInvertColors
                        accessibilityElementsHidden
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : null}
                  </AspectBox>
                }
                onPress={() => {
                  onPressCollection(collection.id);
                }}
              />
            ))}
          </View>
        </View>
      ) : isCollectionsPending ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <Skeleton shape="rect" height={theme.space('space.16')} />
        </View>
      ) : null}

      {liveNow.length > 0 ? (
        <View style={{ gap: theme.space('space.2') }}>
          <Text role="title" style={{ paddingHorizontal: theme.space('space.4') }}>
            Live now
          </Text>
          <View>
            {liveNow.map((item) => (
              <GameActivityRow
                key={item.id}
                item={item}
                onPressGame={onPressGame}
                onPressUser={onPressUser}
              />
            ))}
          </View>
        </View>
      ) : isActivityPending ? (
        <View style={{ paddingHorizontal: theme.space('space.4') }}>
          <Skeleton shape="rect" height={theme.space('space.16')} />
        </View>
      ) : null}

      {nothingYet ? (
        <EmptyState
          icon="users"
          title="Nothing here yet"
          description={`Friends, collections and posts about ${gameTitle} will show up here.`}
        />
      ) : null}
    </View>
  );
}

export const GameCommunityTab = memo(GameCommunityTabComponent);
