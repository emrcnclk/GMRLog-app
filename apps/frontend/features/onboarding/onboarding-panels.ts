export interface OnboardingPanel {
  /** The `display`-sized line — §3's "40px weight 300 title". */
  readonly title: string;
  /** The paragraph under it, capped at `AUTH_MEASURE` by the shell. */
  readonly body: string;
}

/**
 * `SCREEN_REDESIGNS.md` §3 — "Three panels, verbatim from the prototype".
 *
 * §3 gives each panel its title in full and then a three-word gloss of the
 * subject ("logging is two taps", "DNA, completion, archetype", "taste overlap,
 * not trending"). Those glosses are notes about what the panel is *about*, not
 * copy to render, so the bodies are the prototype's own sentences — the titles
 * and the bodies both taken as written, since "verbatim" is the instruction and
 * inventing a sentence here would be inventing product copy.
 *
 * They live in a module rather than inside the screen so the count and the order
 * are one fact: the rail reads its length, the screen reads its entries, and
 * `onboarding-panels.spec.ts` pins the three titles §3 names.
 */
export const ONBOARDING_PANELS: readonly OnboardingPanel[] = [
  {
    title: 'Every game you finish becomes part of the record.',
    body: 'Log a session in two taps. GMRLOG remembers the hours, the platform, and what you thought at the time.',
  },
  {
    title: 'Your profile answers one question: what kind of gamer are you?',
    body: 'Genre DNA, completion rate, favourites and a play history that reads like a résumé — not a scoreboard.',
  },
  {
    title: 'Find the next one from people who play like you.',
    body: 'Recommendations from taste overlap, not from what is trending this week.',
  },
];

/** True when the index is the last panel — the step whose button completes. */
export function isLastOnboardingPanel(index: number): boolean {
  return index === ONBOARDING_PANELS.length - 1;
}

/**
 * The next index, clamped. Advancing past the last panel is the caller's signal
 * to complete, not something this should wrap around to zero.
 */
export function nextOnboardingPanel(index: number): number {
  return Math.min(index + 1, ONBOARDING_PANELS.length - 1);
}
