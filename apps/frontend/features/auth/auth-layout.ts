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

/**
 * §3's step bars: "three 2px bars — the active one is `20px` wide and accent,
 * the rest are `8px` and `border.default`."
 *
 * The two widths land on the scale exactly (`space.5` is 20, `space.2` is 8).
 * The height does not: the scale's smallest step is 4. Two is a *rule weight*
 * rather than a layout gap — the same class as the presence dot's 11 in §11 and
 * `Icon`'s literal sizes — so it stays a number, named here rather than inlined
 * so §2's Register and §3's Onboarding draw one rail and not two.
 */
export const AUTH_STEP_BAR_HEIGHT = 2;

/** §3's active bar. */
export const AUTH_STEP_BAR_WIDTH_ACTIVE: SemanticSpaceToken = 'space.5';

/** §3's inactive bars. */
export const AUTH_STEP_BAR_WIDTH_INACTIVE: SemanticSpaceToken = 'space.2';
