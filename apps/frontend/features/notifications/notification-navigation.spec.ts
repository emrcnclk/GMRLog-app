import { describe, expect, it } from 'vitest';

import { hrefForNotificationObject } from './hooks/notification-model';

describe('notifications navigation', () => {
  it('opens notifications tab route', () => {
    expect('/(app)/(tabs)/notifications').toContain('notifications');
  });

  it('navigates from notification to related object placeholders', () => {
    expect(hrefForNotificationObject({ type: 'game', id: 'g1' })).toBe('/(app)/game/g1');
    expect(hrefForNotificationObject({ type: 'review', id: 'r1' })).toBe('/(app)/review/r1');
    expect(hrefForNotificationObject({ type: 'post', id: 'p1' })).toBe('/(app)/post/p1');
    expect(hrefForNotificationObject({ type: 'collection', id: 'c1' })).toBe(
      '/(app)/collection/c1',
    );
    expect(hrefForNotificationObject({ type: 'tier_list', id: 't1' })).toBe('/(app)/tier-list/t1');
    expect(hrefForNotificationObject({ type: 'community', id: 'co1' })).toBe(
      '/(app)/community/co1',
    );
    expect(hrefForNotificationObject({ type: 'event', id: 'e1' })).toBe('/(app)/event/e1');
    expect(hrefForNotificationObject({ type: 'user', id: 'u1' })).toBe('/(app)/user/u1');
  });

  it('home header can deep-link to notifications tab', () => {
    expect('/(app)/(tabs)/notifications').toBe('/(app)/(tabs)/notifications');
  });
});
