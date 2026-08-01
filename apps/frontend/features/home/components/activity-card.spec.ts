import type { ActivityItemResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { resolveActivityMessage } from '../hooks/activity-feed-model';

/**
 * ActivityCard contract — message + a11y label composition without RN renderer.
 */
describe('ActivityCard content contract', () => {
  it('builds a readable summary from actor + kind message', () => {
    const item: ActivityItemResponse = {
      id: 'a1',
      kind: 'post',
      createdAt: '2026-07-27T12:00:00.000Z',
      readAt: null,
      actor: {
        id: 'u1',
        handle: 'nova',
        displayName: 'Nova',
        avatarUrl: null,
      },
      objectRef: { type: 'post', id: 'p1' },
      messageKey: 'post',
    };

    const message = resolveActivityMessage(item);
    const label = `${item.actor?.displayName ?? 'Someone'} ${message}`;
    expect(label).toBe('Nova shared a post');
  });

  it('falls back when actor is null', () => {
    const item: ActivityItemResponse = {
      id: 'a2',
      kind: 'achievement',
      createdAt: '2026-07-27T12:00:00.000Z',
      readAt: null,
      actor: null,
      objectRef: { type: 'achievement', id: 'ach-1' },
      messageKey: 'achievement',
    };
    expect(resolveActivityMessage(item)).toBe('earned an achievement');
  });
});
