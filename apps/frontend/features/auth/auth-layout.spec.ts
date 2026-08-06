import { describe, expect, it } from 'vitest';

import {
  AUTH_BUTTON_HEIGHT,
  AUTH_GUTTER,
  AUTH_MEASURE,
  AUTH_STEP_BAR_HEIGHT,
  AUTH_STEP_BAR_WIDTH_ACTIVE,
  AUTH_STEP_BAR_WIDTH_INACTIVE,
} from './auth-layout';

/**
 * §2's failure mode, spelled out in the doc: "If Register grows a card or a
 * different title size, the flow breaks." These three constants are what Login,
 * Register and Onboarding have to agree on, so they are pinned here rather than
 * re-derived from §1's pixel numbers on each screen.
 *
 * The assertions are on the token *names*, not on what the scale resolves them
 * to: `spaceScale` is a runtime export of `@gmrlog/ui`, and importing a runtime
 * value from that barrel pulls React Native into the module, which this
 * frontend's vitest cannot parse. The scale's own values are already pinned by
 * `packages/ui`'s tests; what matters here is that these three screens name the
 * same steps.
 */
describe('auth shell layout constants', () => {
  it('resolves the gutter and the button height through space tokens', () => {
    expect(AUTH_GUTTER).toBe('space.6');
    expect(AUTH_BUTTON_HEIGHT).toBe('space.12');
  });

  it('sits on a wider step than the app-wide gutter', () => {
    // §1 asks for 26 where SCREEN_GUTTER is `space.5` (20). The exact number is
    // not on the scale; the relationship is the part that carries meaning.
    expect(AUTH_GUTTER).not.toBe('space.5');
  });

  it('caps the top-zone paragraph at §1 reading measure', () => {
    expect(AUTH_MEASURE).toBe(280);
  });

  it('draws §3 step bars on the scale, and the active one wider', () => {
    expect(AUTH_STEP_BAR_WIDTH_ACTIVE).toBe('space.5');
    expect(AUTH_STEP_BAR_WIDTH_INACTIVE).toBe('space.2');
    expect(AUTH_STEP_BAR_WIDTH_ACTIVE).not.toBe(AUTH_STEP_BAR_WIDTH_INACTIVE);
  });

  it('keeps the bar a 2px rule', () => {
    // The scale's smallest step is 4; a rule weight is not a spacing value.
    expect(AUTH_STEP_BAR_HEIGHT).toBe(2);
  });
});
