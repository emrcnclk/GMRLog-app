import { useEffect, useState } from 'react';

import { MOTION_DURATION } from './tokens';

/**
 * Canonical trough opacity for an attention pulse — the "live" dot in §21's
 * event row and §22's bracket header. Sits beside `PRESS_OPACITY` for the same
 * reason: an opacity constant that two surfaces share is a token, not a literal.
 */
export const PULSE_TROUGH_OPACITY = 0.3;

/**
 * Half-period of the pulse. Reuses the longest duration token rather than
 * inventing a raw ms value — `deliberate` (420ms) gives an ~840ms cycle, a
 * heartbeat rather than a blink.
 */
export const PULSE_HALF_PERIOD_MS = MOTION_DURATION.deliberate;

/** Pure phase → opacity. Reduce-motion holds the dot at its settled, visible state. */
export function pulseOpacity(lit: boolean, reduceMotion: boolean): number {
  if (reduceMotion) {
    return 1;
  }
  return lit ? 1 : PULSE_TROUGH_OPACITY;
}

/**
 * A pulse that actually advances on this build.
 *
 * `Animated.timing` driving `interpolate(transform)` never advances under this
 * app's React Native Web build (CLAUDE.md, "Known platform traps"), which is why
 * every previous live dot in this codebase shipped frozen. The trap is specific:
 * the same note records that *plain re-renders* still work. So this drives
 * `opacity` — never a transform — off `setState` on an interval, touching no
 * part of the `Animated` API. That runs identically on native and web.
 *
 * The interval only exists while `active` is true, so ordinary rows carry no timer.
 */
export function usePulseOpacity(active: boolean, reduceMotion: boolean): number {
  const [lit, setLit] = useState(true);

  useEffect(() => {
    if (!active || reduceMotion) {
      setLit(true);
      return;
    }
    const id = setInterval(() => {
      setLit((current) => !current);
    }, PULSE_HALF_PERIOD_MS);
    return () => {
      clearInterval(id);
    };
  }, [active, reduceMotion]);

  return pulseOpacity(lit, reduceMotion);
}
