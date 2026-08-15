import type { ProfilePinResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { moveEquippedBadge, selectEquippedAchievementIds } from './badge-picker-model';

function pin(
  objectId: string,
  position: number,
  kind: ProfilePinResponse['kind'],
): ProfilePinResponse {
  return { id: `pin-${objectId}`, kind, objectId, position };
}

describe('selectEquippedAchievementIds', () => {
  it('returns achievement-kind pins in stored position order', () => {
    const pins = [
      pin('c', 2, 'achievement'),
      pin('a', 0, 'achievement'),
      pin('b', 1, 'achievement'),
    ];
    expect(selectEquippedAchievementIds(pins)).toEqual(['a', 'b', 'c']);
  });

  it('excludes other pin kinds', () => {
    const pins = [
      pin('game-1', 0, 'game'),
      pin('ach-1', 0, 'achievement'),
      pin('col-1', 1, 'collection'),
    ];
    expect(selectEquippedAchievementIds(pins)).toEqual(['ach-1']);
  });

  it('returns an empty array when nothing is equipped', () => {
    expect(selectEquippedAchievementIds([])).toEqual([]);
  });
});

describe('moveEquippedBadge', () => {
  const order = ['a', 'b', 'c'];

  it('swaps with the neighbour in the given direction', () => {
    expect(moveEquippedBadge(order, 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(moveEquippedBadge(order, 'b', 'down')).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op at either end', () => {
    expect(moveEquippedBadge(order, 'a', 'up')).toEqual(order);
    expect(moveEquippedBadge(order, 'c', 'down')).toEqual(order);
  });

  it('is a no-op for an id that is not present', () => {
    expect(moveEquippedBadge(order, 'z', 'up')).toEqual(order);
  });
});
