import type {
  CommunityMemberRepository,
  Event,
  EventInviteRepository,
  EventParticipationRepository,
  EventRepository,
  GameRepository,
  NotificationRepository,
  UserRepository,
} from '@gmrlog/database';
import type { EventResponse } from '@gmrlog/types';
import type { EventCreateInput, EventInviteInput, EventRsvpInput } from '@gmrlog/validators';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isAuthenticatedIdentity, type RequestIdentity } from '../auth/interfaces/identity';
import { EventReminderPublisher } from '../infrastructure/jobs/event-reminder.publisher';
import { FeedFanoutPublisher } from '../infrastructure/jobs/feed-fanout.publisher';

import {
  EVENT_COMMUNITY_MEMBER_REPOSITORY,
  EVENT_GAME_REPOSITORY,
  EVENT_INVITE_REPOSITORY,
  EVENT_NOTIFICATION_REPOSITORY,
  EVENT_PARTICIPATION_REPOSITORY,
  EVENT_REPOSITORY,
  EVENT_USER_REPOSITORY,
} from './events.tokens';
import { toEventParticipationSummary, toEventResponse } from './mappers/event.mapper';

const NOTIFICATION_KIND_EVENT_INVITE = 'event_invite';
/** D3.24 NOTIFICATION_MATRIX — Looking for team / need players / hosting peers. */
const NOTIFICATION_KIND_EVENT_LFG = 'event_lfg';
/** Documented kind for community-linked event activity (NOTIFICATION_MATRIX). */
const NOTIFICATION_KIND_COMMUNITY_EVENT = 'community_event';

/** RSVP states that schedule a 1h-before reminder. */
const REMINDABLE_STATES = new Set(['going', 'hosting', 'looking_for_team']);

/** LFG transitions that notify event hosts. */
const LFG_SIGNAL_STATES = new Set(['looking_for_team', 'need_players']);

/**
 * Event domain (F6.3 / D2.17 · D3.24 EVENTS_V2).
 * Detail · participation · LFG RSVP · invite · reminder scheduling.
 */
@Injectable()
export class EventsService {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly events: EventRepository,
    @Inject(EVENT_PARTICIPATION_REPOSITORY)
    private readonly participations: EventParticipationRepository,
    @Inject(EVENT_USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(EVENT_INVITE_REPOSITORY) private readonly invites: EventInviteRepository,
    @Inject(EVENT_NOTIFICATION_REPOSITORY)
    private readonly notifications: NotificationRepository,
    @Inject(EVENT_GAME_REPOSITORY) private readonly games: GameRepository,
    @Inject(EVENT_COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMembers: CommunityMemberRepository,
    private readonly reminders: EventReminderPublisher,
    private readonly feedFanout: FeedFanoutPublisher,
  ) {}

  async getEvent(eventId: string, identity: RequestIdentity): Promise<EventResponse> {
    const event = await this.requireActiveEvent(eventId);
    return this.project(event, viewerIdOf(identity));
  }

  /**
   * D3.24 EVENTS_V2 — `POST /events`. Community events require the creator to
   * already be a member (COMMUNITIES_2.md — Member+ may create events).
   * The creator auto-RSVPs `hosting` and community events fan out onto the
   * community `events` tab (FeedFanoutKind `event`).
   */
  async createEvent(actorId: string, input: EventCreateInput): Promise<EventResponse> {
    await this.requireActiveUser(actorId);

    if (input.gameId !== undefined) {
      const game = await this.games.findById(input.gameId);
      if (game == null) {
        throw new NotFoundException('Game not found');
      }
    }

    if (input.communityId !== undefined) {
      const membership = await this.communityMembers.findByCommunityAndUser(
        input.communityId,
        actorId,
      );
      if (membership == null) {
        throw new ForbiddenException('Community membership required to create events here');
      }
    }

    const event = await this.events.create({
      title: input.title,
      kind: input.kind,
      startsAt: new Date(input.startsAt),
      ...(input.endsAt !== undefined ? { endsAt: new Date(input.endsAt) } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.gameId !== undefined ? { game: { connect: { id: input.gameId } } } : {}),
      ...(input.communityId !== undefined
        ? { community: { connect: { id: input.communityId } } }
        : {}),
    });

    await this.participations.create({
      event: { connect: { id: event.id } },
      user: { connect: { id: actorId } },
      state: 'hosting',
    });
    await this.reminders.schedule(event.id, actorId, event.startsAt);

    await this.feedFanout.publish({
      kind: 'event',
      objectId: event.id,
      actorId,
      occurredAt: event.createdAt,
      ...(event.communityId != null ? { communityId: event.communityId } : {}),
    });

    return this.project(event, actorId);
  }

  /**
   * S1 §13.10 / §14.16 — empty body; presence of POST is the contract.
   * Default participation state is `going`. Duplicate join → 409 (backward compat).
   */
  async joinEvent(eventId: string, actorId: string): Promise<void> {
    const event = await this.requireActiveEvent(eventId);
    await this.requireActiveUser(actorId);

    const existing = await this.participations.findByEventAndUser(eventId, actorId);
    if (existing !== null) {
      throw new ConflictException('Already participating in this event');
    }

    await this.participations.create({
      event: { connect: { id: eventId } },
      user: { connect: { id: actorId } },
      state: 'going',
    });
    await this.reminders.schedule(eventId, actorId, event.startsAt);
  }

  async leaveEvent(eventId: string, actorId: string): Promise<void> {
    await this.requireActiveEvent(eventId);
    const deleted = await this.participations.deleteByEventAndUser(eventId, actorId);
    if (!deleted) {
      throw new NotFoundException('Event participation not found');
    }
    await this.reminders.cancel(eventId, actorId);
  }

  /** D3.24 — upsert RSVP with LFG states. */
  async rsvp(eventId: string, actorId: string, input: EventRsvpInput): Promise<EventResponse> {
    const event = await this.requireActiveEvent(eventId);
    await this.requireActiveUser(actorId);

    const existing = await this.participations.findByEventAndUser(eventId, actorId);
    if (existing === null) {
      await this.participations.create({
        event: { connect: { id: eventId } },
        user: { connect: { id: actorId } },
        state: input.state,
      });
    } else if (existing.state !== input.state) {
      await this.participations.updateState(existing.id, input.state);
    }

    if (REMINDABLE_STATES.has(input.state)) {
      await this.reminders.schedule(eventId, actorId, event.startsAt);
    } else {
      await this.reminders.cancel(eventId, actorId);
    }

    if (LFG_SIGNAL_STATES.has(input.state)) {
      await this.notifyLfgHosts(event, actorId);
    }

    return this.project(event, actorId);
  }

  /** D3.24 — invite friends; notify each invitee (`event_invite`). */
  async invite(eventId: string, inviterId: string, input: EventInviteInput): Promise<void> {
    await this.requireActiveEvent(eventId);
    await this.requireActiveUser(inviterId);

    for (const inviteeId of input.userIds) {
      if (inviteeId === inviterId) {
        continue;
      }
      await this.requireActiveUser(inviteeId);
      const existing = await this.invites.findByEventAndInvitee(eventId, inviteeId);
      if (existing !== null) {
        continue;
      }
      await this.invites.create({
        event: { connect: { id: eventId } },
        inviter: { connect: { id: inviterId } },
        invitee: { connect: { id: inviteeId } },
      });
      await this.notifications.create({
        recipient: { connect: { id: inviteeId } },
        kind: NOTIFICATION_KIND_EVENT_INVITE,
        objectType: 'event',
        objectId: eventId,
      });
    }
  }

  /**
   * Notify LFG peers (`event_lfg` — NOTIFICATION_MATRIX).
   * Hosting / looking_for_team / need_players participants receive the signal.
   * Community-linked events also emit `community_event` to the same hosts (digest path).
   */
  private async notifyLfgHosts(event: Event, actorId: string): Promise<void> {
    const peers = await this.participations.listByEvent(event.id);
    for (const peer of peers) {
      if (peer.userId === actorId) {
        continue;
      }
      const isLfgPeer =
        peer.state === 'hosting' ||
        peer.state === 'looking_for_team' ||
        peer.state === 'need_players';
      if (!isLfgPeer) {
        continue;
      }
      await this.notifications.create({
        recipient: { connect: { id: peer.userId } },
        kind: NOTIFICATION_KIND_EVENT_LFG,
        objectType: 'event',
        objectId: event.id,
      });
      if (event.communityId != null && peer.state === 'hosting') {
        await this.notifications.create({
          recipient: { connect: { id: peer.userId } },
          kind: NOTIFICATION_KIND_COMMUNITY_EVENT,
          objectType: 'event',
          objectId: event.id,
        });
      }
    }
  }

  private async project(event: Event, viewerId: string | null): Promise<EventResponse> {
    let viewerParticipation = null;
    if (viewerId !== null) {
      const participation = await this.participations.findByEventAndUser(event.id, viewerId);
      if (participation) {
        viewerParticipation = toEventParticipationSummary(participation);
      }
    }
    return toEventResponse(event, viewerParticipation);
  }

  private async requireActiveEvent(eventId: string): Promise<Event> {
    const event = await this.events.findActiveById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (user == null || user.deletedAt != null) {
      throw new NotFoundException('User not found');
    }
  }
}

function viewerIdOf(identity: RequestIdentity): string | null {
  return isAuthenticatedIdentity(identity) ? identity.userId : null;
}
