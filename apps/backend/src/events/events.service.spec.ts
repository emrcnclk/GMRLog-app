import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestIdentity } from '../auth/interfaces/identity';
import type { EventReminderPublisher } from '../infrastructure/jobs/event-reminder.publisher';
import {
  asFeedFanoutPublisher,
  createFakeFeedFanoutPublisher,
  type FakeFeedFanoutPublisher,
} from '../infrastructure/jobs/testing/fake-feed-fanout.publisher';
import { createFakeNotificationRepository } from '../notifications/testing/fake-repositories';
import {
  createFakeCommunityMemberRepository,
  makeCommunityMember,
  type FakeCommunityMemberRepository,
} from '../communities/testing/fake-repositories';
import {
  createFakeGameRepository,
  makeGame,
  type FakeGameRepository,
} from '../games/testing/fake-repositories';

import { EventsService } from './events.service';
import {
  createFakeEventInviteRepository,
  createFakeEventParticipationRepository,
  createFakeEventRepository,
  createFakeUserRepository,
  makeEvent,
  makeParticipation,
  makeUser,
  type FakeEventInviteRepository,
  type FakeEventParticipationRepository,
  type FakeEventRepository,
  type FakeUserRepository,
} from './testing/fake-repositories';

const guest: RequestIdentity = { class: 'guest' };
const player: RequestIdentity = { class: 'player', userId: 'user-1' };

let events: FakeEventRepository;
let participations: FakeEventParticipationRepository;
let users: FakeUserRepository;
let invites: FakeEventInviteRepository;
let notifications: ReturnType<typeof createFakeNotificationRepository>;
let games: FakeGameRepository;
let communityMembers: FakeCommunityMemberRepository;
let feedFanout: FakeFeedFanoutPublisher;
let reminders: {
  schedule: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
};
let service: EventsService;

beforeEach(() => {
  events = createFakeEventRepository([
    makeEvent({ id: 'event-1', title: 'Culture Cup' }),
    makeEvent({
      id: 'event-community',
      title: 'Raid Night',
      communityId: 'community-1',
      startsAt: new Date('2030-01-02T00:00:00.000Z'),
    }),
    makeEvent({
      id: 'event-deleted',
      title: 'Gone',
      deletedAt: new Date('2026-01-03T00:00:00.000Z'),
    }),
  ]);
  participations = createFakeEventParticipationRepository();
  users = createFakeUserRepository([
    makeUser({ id: 'user-1', handle: 'gamer' }),
    makeUser({ id: 'user-2', handle: 'friend', displayName: 'Friend' }),
    makeUser({ id: 'user-host', handle: 'host', displayName: 'Host' }),
  ]);
  invites = createFakeEventInviteRepository();
  notifications = createFakeNotificationRepository();
  games = createFakeGameRepository([{ game: makeGame({ id: 'game-1' }) }]);
  communityMembers = createFakeCommunityMemberRepository([
    makeCommunityMember({
      id: 'member-1',
      communityId: 'community-1',
      userId: 'user-1',
      role: 'member',
    }),
  ]);
  feedFanout = createFakeFeedFanoutPublisher();
  reminders = {
    schedule: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
  service = new EventsService(
    events,
    participations,
    users,
    invites,
    notifications,
    games,
    communityMembers,
    reminders as unknown as EventReminderPublisher,
    asFeedFanoutPublisher(feedFanout),
  );
});

describe('EventsService.getEvent', () => {
  it('returns event detail for guests without participation', async () => {
    const detail = await service.getEvent('event-1', guest);
    expect(detail).toMatchObject({
      id: 'event-1',
      title: 'Culture Cup',
      kind: 'tournament',
      viewerParticipation: null,
    });
  });

  it('includes viewerParticipation for authenticated participants', async () => {
    participations.rows.set(
      'p-1',
      makeParticipation({
        id: 'p-1',
        eventId: 'event-1',
        userId: 'user-1',
        state: 'going',
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      }),
    );
    const detail = await service.getEvent('event-1', player);
    expect(detail.viewerParticipation).toEqual({
      state: 'going',
      createdAt: '2026-01-01T12:00:00.000Z',
    });
  });

  it('hides soft-deleted events as not found', async () => {
    await expect(service.getEvent('event-deleted', guest)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('EventsService.joinEvent / leaveEvent', () => {
  it('joins with default going state and rejects duplicates', async () => {
    await service.joinEvent('event-1', 'user-1');
    const row = [...participations.rows.values()].find(
      (p) => p.eventId === 'event-1' && p.userId === 'user-1',
    );
    expect(row?.state).toBe('going');
    expect(reminders.schedule).toHaveBeenCalledWith('event-1', 'user-1', expect.any(Date));

    await expect(service.joinEvent('event-1', 'user-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('leaves participation and rejects missing leave', async () => {
    await service.joinEvent('event-1', 'user-1');
    await service.leaveEvent('event-1', 'user-1');
    expect(await participations.findByEventAndUser('event-1', 'user-1')).toBeNull();
    expect(reminders.cancel).toHaveBeenCalledWith('event-1', 'user-1');

    await expect(service.leaveEvent('event-1', 'user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects participation on deleted events', async () => {
    await expect(service.joinEvent('event-deleted', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('EventsService.rsvp', () => {
  it('creates participation when missing', async () => {
    const detail = await service.rsvp('event-1', 'user-1', { state: 'interested' });
    expect(detail.viewerParticipation?.state).toBe('interested');
    expect(reminders.cancel).toHaveBeenCalledWith('event-1', 'user-1');
  });

  it('updates state when participation already exists', async () => {
    await service.rsvp('event-1', 'user-1', { state: 'interested' });
    const detail = await service.rsvp('event-1', 'user-1', { state: 'looking_for_team' });
    expect(detail.viewerParticipation?.state).toBe('looking_for_team');
    expect(reminders.schedule).toHaveBeenCalledWith('event-1', 'user-1', expect.any(Date));
  });

  it('schedules reminder for going / hosting / looking_for_team', async () => {
    await service.rsvp('event-1', 'user-1', { state: 'going' });
    expect(reminders.schedule).toHaveBeenCalled();

    reminders.schedule.mockClear();
    await service.rsvp('event-1', 'user-1', { state: 'hosting' });
    expect(reminders.schedule).toHaveBeenCalled();

    reminders.schedule.mockClear();
    await service.rsvp('event-1', 'user-1', { state: 'looking_for_team' });
    expect(reminders.schedule).toHaveBeenCalled();
  });

  it('notifies community event hosts on LFG transitions', async () => {
    participations.rows.set(
      'host-p',
      makeParticipation({
        id: 'host-p',
        eventId: 'event-community',
        userId: 'user-host',
        state: 'hosting',
      }),
    );

    await service.rsvp('event-community', 'user-1', { state: 'looking_for_team' });

    const hostNotifs = [...notifications.rows.values()].filter(
      (n) => n.recipientId === 'user-host' && n.kind === 'event_lfg',
    );
    expect(hostNotifs).toHaveLength(1);
    expect(hostNotifs[0]?.objectId).toBe('event-community');

    const communityNotifs = [...notifications.rows.values()].filter(
      (n) => n.recipientId === 'user-host' && n.kind === 'community_event',
    );
    expect(communityNotifs).toHaveLength(1);
  });

  it('emits event_lfg for non-community LFG peers', async () => {
    participations.rows.set(
      'host-p',
      makeParticipation({
        id: 'host-p',
        eventId: 'event-1',
        userId: 'user-host',
        state: 'hosting',
      }),
    );

    await service.rsvp('event-1', 'user-1', { state: 'need_players' });
    const hostNotifs = [...notifications.rows.values()].filter(
      (n) => n.recipientId === 'user-host' && n.kind === 'event_lfg',
    );
    expect(hostNotifs).toHaveLength(1);
  });
});

describe('EventsService.createEvent', () => {
  it('creates a standalone event, auto-hosts the creator, and schedules a reminder', async () => {
    const created = await service.createEvent('user-1', {
      title: 'Boss Rush',
      kind: 'coop_session',
      startsAt: '2030-06-01T18:00:00.000Z',
    });

    expect(created).toMatchObject({ title: 'Boss Rush', kind: 'coop_session' });
    const hostRow = [...participations.rows.values()].find(
      (row) => row.eventId === created.id && row.userId === 'user-1',
    );
    expect(hostRow?.state).toBe('hosting');
    expect(reminders.schedule).toHaveBeenCalledWith(created.id, 'user-1', expect.any(Date));
    expect(feedFanout.calls).toHaveLength(1);
    expect(feedFanout.calls[0]).toMatchObject({
      kind: 'event',
      objectId: created.id,
      actorId: 'user-1',
    });
  });

  it('rejects unknown game ids', async () => {
    await expect(
      service.createEvent('user-1', {
        title: 'Raid',
        kind: 'raid',
        startsAt: '2030-06-01T18:00:00.000Z',
        gameId: 'missing-game',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires community membership to create a community event', async () => {
    await expect(
      service.createEvent('user-2', {
        title: 'Members Only Raid',
        kind: 'raid',
        startsAt: '2030-06-01T18:00:00.000Z',
        communityId: 'community-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fans a community event onto the community feed', async () => {
    const created = await service.createEvent('user-1', {
      title: 'Guild Raid',
      kind: 'raid',
      startsAt: '2030-06-01T18:00:00.000Z',
      communityId: 'community-1',
    });

    expect(feedFanout.calls[0]).toMatchObject({
      kind: 'event',
      objectId: created.id,
      communityId: 'community-1',
    });
  });
});

describe('EventsService.invite', () => {
  it('creates invites and event_invite notifications', async () => {
    await service.invite('event-1', 'user-1', { userIds: ['user-2'] });

    expect([...invites.rows.values()]).toHaveLength(1);
    const notifs = [...notifications.rows.values()];
    expect(notifs).toHaveLength(1);
    expect(notifs[0]).toMatchObject({
      recipientId: 'user-2',
      kind: 'event_invite',
      objectType: 'event',
      objectId: 'event-1',
    });
  });

  it('skips self and duplicate invites', async () => {
    await service.invite('event-1', 'user-1', { userIds: ['user-1', 'user-2'] });
    expect([...invites.rows.values()]).toHaveLength(1);

    await service.invite('event-1', 'user-1', { userIds: ['user-2'] });
    expect([...invites.rows.values()]).toHaveLength(1);
    expect([...notifications.rows.values()]).toHaveLength(1);
  });

  it('rejects invite on deleted events', async () => {
    await expect(
      service.invite('event-deleted', 'user-1', { userIds: ['user-2'] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
