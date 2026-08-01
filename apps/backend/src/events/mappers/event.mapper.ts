import type { Event, EventParticipation, User } from '@gmrlog/database';
import type {
  EventParticipationResponse,
  EventParticipationSummary,
  EventResponse,
} from '@gmrlog/types';

import { toUserPublicResponse } from '../../posts/mappers/post.mapper';

/**
 * Persistence → S1 §15.6 EventResponse.
 * No FOMO countdown fields. Soft-deleted events are never projected here.
 */
export function toEventResponse(
  event: Event,
  viewerParticipation: EventParticipationSummary | null = null,
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
  };
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
