import { describe, expect, it } from 'vitest';

import { MOTION_DURATION } from './tokens';
import { PULSE_HALF_PERIOD_MS, PULSE_TROUGH_OPACITY, pulseOpacity } from './pulse';

describe('pulse motion', () => {
  it('alternates between full and trough opacity', () => {
    expect(pulseOpacity(true, false)).toBe(1);
    expect(pulseOpacity(false, false)).toBe(PULSE_TROUGH_OPACITY);
  });

  it('holds at the settled visible state under reduce motion', () => {
    expect(pulseOpacity(true, true)).toBe(1);
    expect(pulseOpacity(false, true)).toBe(1);
  });

  it('keeps the trough visible — a pulse dims, it does not disappear', () => {
    expect(PULSE_TROUGH_OPACITY).toBeGreaterThan(0);
    expect(PULSE_TROUGH_OPACITY).toBeLessThan(1);
  });

  it('takes its half-period from a duration token, not a raw ms value', () => {
    expect(PULSE_HALF_PERIOD_MS).toBe(MOTION_DURATION.deliberate);
  });
});
