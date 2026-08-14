import type {
  CommunityRepository,
  Event,
  EventParticipation,
  EventParticipationRepository,
  User,
} from '@gmrlog/database';
import type {
  EventParticipationResponse,
  EventParticipationSummary,
  EventResponse,
} from '@gmrlog/types';

import { toUserPublicResponse } from '../../posts/mappers/post.mapper';

export interface EventResponseExtras {
  communityName?: string | null;
  attendeeCount?: number;
}

/**
 * Persistence → S1 §15.6 EventResponse.
 * No FOMO countdown fields. Soft-deleted events are never projected here.
 */
export function toEventResponse(
  event: Event,
  viewerParticipation: EventParticipationSummary | null = null,
  extras: EventResponseExtras = {},
): EventResponse {
  return {
    id: event.id,
    title: event.title,
    kind: event.kind,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    viewerParticipation,
    ...(event.gameId != null ? { gameId: event.gameId } : {}),
    ...(event.communityId != null ? { communityId: event.communityId } : {}),
    ...(extras.communityName !== undefined ? { communityName: extras.communityName } : {}),
    ...(extras.attendeeCount !== undefined ? { attendeeCount: extras.attendeeCount } : {}),
  };
}

export interface EventResponseExtrasRepositories {
  participations: Pick<EventParticipationRepository, 'countAttendeesByEvents'>;
  communities: Pick<CommunityRepository, 'findManyByIds'>;
}

/**
 * 9.4 — batched `communityName`/`attendeeCount` for a page of events, same
 * `Promise.all([...])`-of-grouped-queries shape 9.2/9.3 established
 * (`computeUnreadCounts`/`computeHolderPercents`). Two queries regardless of
 * page size, run even for a single event so `getEvent`/`rsvp` stay
 * consistent with the list dialect.
 */
export async function loadEventResponseExtras(
  events: readonly Event[],
  repos: EventResponseExtrasRepositories,
): Promise<Map<string, EventResponseExtras>> {
  if (events.length === 0) {
    return new Map();
  }
  const eventIds = events.map((event) => event.id);
  const communityIds = [
    ...new Set(events.flatMap((event) => (event.communityId != null ? [event.communityId] : []))),
  ];

  const [attendeeCounts, communities] = await Promise.all([
    repos.participations.countAttendeesByEvents(eventIds),
    communityIds.length > 0 ? repos.communities.findManyByIds(communityIds) : Promise.resolve([]),
  ]);

  const attendeeCountByEvent = new Map(attendeeCounts.map((row) => [row.eventId, row.count]));
  const communityNameById = new Map(communities.map((community) => [community.id, community.name]));

  return new Map(
    events.map((event) => [
      event.id,
      {
        attendeeCount: attendeeCountByEvent.get(event.id) ?? 0,
        ...(event.communityId != null
          ? { communityName: communityNameById.get(event.communityId) ?? null }
          : {}),
      },
    ]),
  );
}

export function toEventParticipationSummary(
  participation: EventParticipation,
): EventParticipationSummary {
  return {
    state: participation.state,
    createdAt: participation.createdAt.toISOString(),
  };
}

export function toEventParticipationResponse(
  participation: EventParticipation,
  user: User,
): EventParticipationResponse {
  return {
    user: toUserPublicResponse(user),
    state: participation.state,
    createdAt: participation.createdAt.toISOString(),
  };
}
