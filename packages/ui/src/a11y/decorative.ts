/**
 * Props that remove a purely ornamental element from the accessibility tree.
 *
 * Both platform flags are required, and neither is sufficient alone:
 * iOS honours `accessibilityElementsHidden`, Android honours
 * `importantForAccessibility="no-hide-descendants"`, and `accessible={false}`
 * stops the view itself from being focusable on either. Spreading all three is
 * the only spelling that behaves identically on both platforms.
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
} as const;

export type HiddenFromAssistiveTechProps = typeof HIDDEN_FROM_ASSISTIVE_TECH;
