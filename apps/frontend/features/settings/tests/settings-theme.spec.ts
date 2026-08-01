import { describe, expect, it } from 'vitest';

import { themeLabel, THEME_OPTIONS } from '../model/settings-model';

describe('settings theme', () => {
  it('supports light dark system only', () => {
    expect(THEME_OPTIONS).toHaveLength(3);
    expect(THEME_OPTIONS).toContain('light');
    expect(THEME_OPTIONS).toContain('dark');
    expect(THEME_OPTIONS).toContain('system');
  });

  it('labels each theme for accessibility', () => {
    for (const option of THEME_OPTIONS) {
      expect(themeLabel(option).length).toBeGreaterThan(0);
    }
  });
});
