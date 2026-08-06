import type { SemanticSpaceToken } from '@gmrlog/ui';

/**
 * `SCREEN_REDESIGNS.md` §1 — the auth shell's three layout constants.
 *
 * They live in a plain module rather than beside the shell component so §2's
 * Register and §3's Onboarding import the same three values instead of each
 * rounding §1's pixel numbers again. §2's failure mode is the two screens
 * drifting apart; a shared constant is the cheapest way to stop it, and the spec
 * beside this file pins them.
 */

/**
 * §1 puts the auth screens on a 26px gutter where the rest of the app sits on
 * `SCREEN_GUTTER` (20). The scale has no 26; `space.6` (24) is the nearest step
 * and keeps the screen deliberately airier than the tabbed surfaces, which is
 * what the wider number was saying.
 */
export const AUTH_GUTTER: SemanticSpaceToken = 'space.6';

/** §1's "50px tall" provider buttons, rounded onto the scale: `space.12` is 48. */
export const AUTH_BUTTON_HEIGHT: SemanticSpaceToken = 'space.12';

/**
 * §1's 280px paragraph cap. A reading measure, not a spacing value — the same
 * class of compositional constant as the profile case cover's 98px width.
 */
export const AUTH_MEASURE = 280;
