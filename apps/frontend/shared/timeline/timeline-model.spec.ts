import type {
  ActivityItemResponse,
  ActivityKindValue,
  FeedItemResponse,
  ObjectTypeValue,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  activityToTimelineCard,
  feedItemToTimelineCard,
  formatTimelineTime,
  timelineMessageForKind,
  timelineObjectRoute,
  timelineToneForKind,
} from './timeline-model';

const ALL_KINDS: ActivityKindValue[] = [
  'review',
  'post',
  'collection',
  'game_log',
  'tier_list',
  'friend',
  'recommendation_slot',
  'community',
  'event',
  'achievement',
  'library_import',
  'like',
  'comment',
  'wishlist',
  'profile_pin',
  'milestone',
  'library_synced',
  'achievement_synced',
  'playtime_updated',
  'integration_connected',
  'integration_disconnected',
];

const ALL_OBJECT_TYPES: ObjectTypeValue[] = [
  'game',
  'post',
  'review',
  'comment',
  'collection',
  'tier_list',
  'user',
  'community',
  'event',
  'achievement',
];

const NOW = Date.parse('2026-08-01T12:00:00.000Z');

function activity(overrides: Partial<ActivityItemResponse> = {}): ActivityItemResponse {
  return {
    id: 'a1',
    kind: 'review',
    createdAt: '2026-08-01T11:00:00.000Z',
    readAt: null,
    actor: { id: 'u1', handle: 'ari', displayName: 'Ari', avatarUrl: null },
    objectRef: { type: 'review', id: 'r1' },
    messageKey: 'review',
    ...overrides,
  };
}

describe('kind coverage', () => {
  it('assigns a tone and a message to every locked activity kind', () => {
    for (const kind of ALL_KINDS) {
      expect(timelineToneForKind(kind)).toBeDefined();
      expect(timelineMessageForKind(kind).length).toBeGreaterThan(0);
    }
  });

  it('maps the sprint card types onto their tones', () => {
    expect(timelineToneForKind('review')).toBe('review');
    expect(timelineToneForKind('game_log')).toBe('finished');
    expect(timelineToneForKind('achievement')).toBe('achievement');
    expect(timelineToneForKind('collection')).toBe('collection');
    expect(timelineToneForKind('friend')).toBe('follow');
    expect(timelineToneForKind('comment')).toBe('comment');
    expect(timelineToneForKind('like')).toBe('like');
  });
});

describe('formatTimelineTime', () => {
  it('describes recent events relatively', () => {
    expect(formatTimelineTime('2026-08-01T11:59:30.000Z', NOW)).toBe('Just now');
    expect(formatTimelineTime('2026-08-01T11:30:00.000Z', NOW)).toBe('30m');
    expect(formatTimelineTime('2026-08-01T09:00:00.000Z', NOW)).toBe('3h');
    expect(formatTimelineTime('2026-07-30T12:00:00.000Z', NOW)).toBe('2d');
  });

  it('falls back to an absolute date beyond a week', () => {
    expect(formatTimelineTime('2026-06-01T12:00:00.000Z', NOW)).not.toMatch(/d$/);
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatTimelineTime('not-a-date', NOW)).toBe('');
  });

  it('never reports negative time for a clock-skewed future event', () => {
    expect(formatTimelineTime('2026-08-01T13:00:00.000Z', NOW)).toBe('Just now');
  });
});

describe('activityToTimelineCard', () => {
  it('builds a full card model', () => {
    const model = activityToTimelineCard(activity(), NOW);
    expect(model.id).toBe('a1');
    expect(model.tone).toBe('review');
    expect(model.message).toBe('published a review');
    expect(model.timeLabel).toBe('1h');
    expect(model.accessibilityLabel).toBe('Ari published a review, 1h');
  });

  it('handles a missing actor without saying "undefined"', () => {
    const model = activityToTimelineCard(activity({ actor: null }), NOW);
    expect(model.accessibilityLabel.startsWith('Someone ')).toBe(true);
  });

  it('omits the time clause when the timestamp is unusable', () => {
    const model = activityToTimelineCard(activity({ createdAt: 'nope' }), NOW);
    expect(model.accessibilityLabel).toBe('Ari published a review');
  });
});

describe('feedItemToTimelineCard', () => {
  it('reads occurredAt and object rather than createdAt and objectRef', () => {
    const item: FeedItemResponse = {
      id: 'f1',
      kind: 'achievement',
      occurredAt: '2026-08-01T10:00:00.000Z',
      actor: { id: 'u2', handle: 'bo', displayName: 'Bo', avatarUrl: null },
      object: { type: 'achievement', id: 'ach1' },
      projection: null,
    };
    const model = feedItemToTimelineCard(item, NOW);
    expect(model.tone).toBe('achievement');
    expect(model.timeLabel).toBe('2h');
    expect(model.objectRef.type).toBe('achievement');
  });
});

describe('timelineObjectRoute', () => {
  it('resolves a route for every object type that has a screen', () => {
    expect(timelineObjectRoute({ type: 'review', id: 'r1' })).toBe('/(app)/review/r1');
    expect(timelineObjectRoute({ type: 'game', id: 'g1' })).toBe('/(app)/game/g1');
    expect(timelineObjectRoute({ type: 'tier_list', id: 't1' })).toBe('/(app)/tier-list/t1');
    expect(timelineObjectRoute({ type: 'user', id: 'u1' })).toBe('/(app)/user/u1');
  });

  it('returns null for object types with no destination', () => {
    expect(timelineObjectRoute({ type: 'comment', id: 'c1' })).toBeNull();
    expect(timelineObjectRoute({ type: 'achievement', id: 'a1' })).toBeNull();
  });

  it('never throws for any member of the closed vocabulary', () => {
    for (const type of ALL_OBJECT_TYPES) {
      expect(() => timelineObjectRoute({ type, id: 'x' })).not.toThrow();
    }
  });
});
