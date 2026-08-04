import { describe, expect, it } from 'vitest';

import { createThemeTokens } from './palettes';
import {
  TOGGLE_KNOB_INSET,
  TOGGLE_KNOB_SIZE,
  TOGGLE_KNOB_TRAVEL,
  TOGGLE_TRACK_HEIGHT,
  TOGGLE_TRACK_WIDTH,
} from './toggle-geometry';

describe('Toggle geometry (SCREEN_REDESIGNS.md §9)', () => {
  it('pins the 40×23 track and 17px knob', () => {
    expect(TOGGLE_TRACK_WIDTH).toBe(40);
    expect(TOGGLE_TRACK_HEIGHT).toBe(23);
    expect(TOGGLE_KNOB_SIZE).toBe(17);
  });

  it('centers the knob inside the track and keeps its travel inside the border', () => {
    expect(TOGGLE_KNOB_INSET).toBe(3);
    expect(TOGGLE_KNOB_TRAVEL).toBe(TOGGLE_TRACK_WIDTH - TOGGLE_KNOB_SIZE - TOGGLE_KNOB_INSET);
    expect(TOGGLE_KNOB_TRAVEL).toBeGreaterThan(TOGGLE_KNOB_INSET);
  });
});

describe('Toggle contract tokens', () => {
  it('exposes the on/off colors Toggle resolves', () => {
    const dark = createThemeTokens('dark');
    const light = createThemeTokens('light');

    for (const tokens of [dark, light]) {
      expect(tokens.color['color.accent.default']).toBeTruthy();
      expect(tokens.color['color.accent.onAccent']).toBeTruthy();
      expect(tokens.color['color.border.default']).toBeTruthy();
      expect(tokens.color['color.background.elevated']).toBeTruthy();
      expect(tokens.radius['radius.full']).toBe(9999);
    }
  });
});
