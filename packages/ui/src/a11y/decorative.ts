/**
 * Props that remove a purely ornamental element from the accessibility tree.
 *
 * Four flags, none of them redundant. `accessibilityElementsHidden` (iOS),
 * `importantForAccessibility="no-hide-descendants"` (Android) and
 * `accessible={false}` (both) are the legacy native-only spelling and, on
 * their own, do nothing on web — measured live, 8.2: react-native-web's
 * `createDOMProps` only reads the modern `aria-*` prop names, so none of the
 * three legacy props above ever reaches the DOM. `role="img"`-free, unlabelled
 * decoration (the DNA match ring, an achievement's rarity glow) rendered with
 * no `aria-hidden` at all and no separate accessible name — invisible to a
 * sighted mouse user, but a screen reader's element-by-element navigation
 * could still land on it. `aria-hidden: true` is the one flag of the four that
 * actually reaches the DOM (`createDOMProps` maps `aria-hidden` straight
 * through), **and** it is not a web-only fork: React Native's own `View`
 * merges `aria-hidden` into `accessibilityElementsHidden` **and**
 * `importantForAccessibility` internally (`View.js`), so on native it is the
 * modern spelling of the same two legacy flags, not a fifth, competing one.
 * All four are kept together — the legacy three cost nothing extra on native
 * and guard against an RN version where the `aria-*` bridge is ever missing.
 *
 * Use on decoration — medallions behind an empty-state message, chevrons inside
 * an already-labelled button, rating pips beside the number they repeat. Do not
 * use on anything that carries information nothing else conveys; hide the glyph
 * only when its meaning survives without it.
 *
 * The failure this prevents is not silence but noise: an unlabelled decorative
 * `View` is skipped, whereas a *labelled* one becomes a focus stop that reads
 * its label aloud ahead of the real content.
 */
export const HIDDEN_FROM_ASSISTIVE_TECH = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants',
  'aria-hidden': true,
} as const;

export type HiddenFromAssistiveTechProps = typeof HIDDEN_FROM_ASSISTIVE_TECH;
