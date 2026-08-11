import type { CommunityResponse, FeedItemResponse } from '@gmrlog/types';
import { Button, EmptyState, Loading, Text, useTheme } from '@gmrlog/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { TimelineCard } from '../../../shared/timeline/timeline-card';
import {
  feedItemToTimelineCard,
  timelineObjectRoute,
} from '../../../shared/timeline/timeline-model';
import { EventCard } from '../../events/components/event-card';
import {
  useCommunityEvents,
  useCommunityFeed,
  useCommunityMembers,
} from '../hooks/use-communities';

import { CommunityMemberCard } from './community-member-card';

/**
 * A thin adapter over the shared `TimelineCard`, exactly like the Game hub's
 * activity row — the community feed owns no card markup of its own, so a post
 * reads the same wherever it appears.
 */
function CommunityFeedRow({ item }: { item: FeedItemResponse }) {
  const router = useRouter();
  const model = useMemo(() => feedItemToTimelineCard(item), [item]);
  const route = timelineObjectRoute(model.objectRef);

  return (
    <TimelineCard
      model={model}
      onPress={
        route === null
          ? undefined
          : () => {
              router.push(route);
            }
      }
    />
  );
}

/** How many members the shell shows before handing off to the members screen. */
const MEMBERS_PREVIEW = 5;

/**
 * §14's About tab. The description is the only thing `CommunityResponse`
 * carries that belongs here — no created date, no privacy, no rules, no links.
 */
export function CommunityAboutTab({ community }: { community: CommunityResponse }) {
  return community.description === null || community.description.length === 0 ? (
    <Text role="body" color="color.text.tertiary">
      No description yet.
    </Text>
  ) : (
    <Text role="body" color="color.text.primary">
      {community.description}
    </Text>
  );
}

/**
 * §14's Members tab — **preview only**. The task brief is explicit that the
 * Members tab's content is 7.2–7.4, so this shows the first few members in the
 * existing card and hands off rather than building the list twice.
 */
export function CommunityMembersTab({
  communityId,
  onSeeAll,
}: {
  communityId: string;
  onSeeAll: () => void;
}) {
  const theme = useTheme();
  const members = useCommunityMembers(communityId);

  if (members.status === 'loading') {
    return <Loading label="Loading members" />;
  }
  if (members.status === 'error') {
    return (
      <Text role="body" color="color.text.tertiary">
        Members could not be loaded.
      </Text>
    );
  }
  if (members.status === 'empty') {
    return <EmptyState icon="users" title="No members yet" description="Nobody has joined." />;
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      {members.items.slice(0, MEMBERS_PREVIEW).map((member) => (
        <CommunityMemberCard key={member.user.id} member={member} />
      ))}
      {members.items.length > MEMBERS_PREVIEW ? (
        <Button variant="secondary" accessibilityLabel="See all members" onPress={onSeeAll}>
          See all members
        </Button>
      ) : null}
    </View>
  );
}

/**
 * §14's Events tab — `GET /communities/{id}/events` (3b.2a), rendered with
 * the same `EventCard` Discover and the game hub already use, soonest first.
 */
export function CommunityEventsTab({ communityId }: { communityId: string }) {
  const theme = useTheme();
  const router = useRouter();
  const events = useCommunityEvents(communityId);

  const openEvent = useCallback(
    (eventId: string) => {
      router.push(`/(app)/event/${eventId}`);
    },
    [router],
  );

  if (events.status === 'loading') {
    return <Loading label="Loading events" />;
  }
  if (events.status === 'error') {
    return (
      <Text role="body" color="color.text.tertiary">
        Events could not be loaded.
      </Text>
    );
  }
  if (events.status === 'empty') {
    return (
      <EmptyState
        icon="calendar"
        title="No events yet"
        description="Events hosted by this circle will show up here."
      />
    );
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      {events.items.map((event) => (
        <EventCard key={event.id} event={event} onPress={openEvent} />
      ))}
      {events.isFetchingNextPage ? <Loading label="Loading more" /> : null}
    </View>
  );
}

/** §14's Feed tab — `GET /communities/{id}/feed`, rendered with the same card the home feed uses. */
export function CommunityFeedTab({ communityId }: { communityId: string }) {
  const theme = useTheme();
  const feed = useCommunityFeed(communityId);

  if (feed.status === 'loading') {
    return <Loading label="Loading feed" />;
  }
  if (feed.status === 'error') {
    return (
      <Text role="body" color="color.text.tertiary">
        The feed could not be loaded.
      </Text>
    );
  }
  if (feed.status === 'empty') {
    return (
      <EmptyState
        icon="message-square"
        title="Nothing here yet"
        description="Posts from this circle will show up here."
      />
    );
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      {feed.items.map((item) => (
        <CommunityFeedRow key={item.id} item={item} />
      ))}
      {feed.isFetchingNextPage ? <Loading label="Loading more" /> : null}
    </View>
  );
}
