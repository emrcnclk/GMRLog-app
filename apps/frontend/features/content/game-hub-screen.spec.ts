import { describe, expect, it } from 'vitest';

import { GAME_HUB_TABS, formatHubTabLabel, gameHubTabPath } from './hooks/game-hub-model';

describe('game hub screen helpers', () => {
  it('formats tab labels with optional counts', () => {
    expect(formatHubTabLabel('Reviews', undefined)).toBe('Reviews');
    expect(formatHubTabLabel('Guides', 3)).toBe('Guides (3)');
    expect(formatHubTabLabel('Events', 0)).toBe('Events (0)');
  });

  it('defines all hub tabs and route paths', () => {
    expect(GAME_HUB_TABS.map((tab) => tab.key)).toEqual([
      'timeline',
      'reviews',
      'guides',
      'collections',
      'events',
      'communities',
      'players',
      'screenshots',
    ]);
    expect(gameHubTabPath('g1', 'timeline')).toBe('/(app)/game/g1/timeline');
  });
});
