/**
 * `Toggle`'s geometry (SCREEN_REDESIGNS.md §9: "40×23 track, 17px knob").
 *
 * Pure — no React Native import — so a spec can pin the numbers without
 * pulling in RN, which Vitest's SSR transform cannot parse (see
 * `button.spec.ts`'s note on `import typeof`).
 */
export const TOGGLE_TRACK_WIDTH = 40;
export const TOGGLE_TRACK_HEIGHT = 23;
export const TOGGLE_KNOB_SIZE = 17;
export const TOGGLE_KNOB_INSET = (TOGGLE_TRACK_HEIGHT - TOGGLE_KNOB_SIZE) / 2;
export const TOGGLE_KNOB_TRAVEL = TOGGLE_TRACK_WIDTH - TOGGLE_KNOB_SIZE - TOGGLE_KNOB_INSET;
