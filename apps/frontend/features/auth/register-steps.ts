import { sessionRegisterSchema, type SessionRegisterInput } from '@gmrlog/validators';

/**
 * The fields a player actually types.
 *
 * 12.4 added `shownLegalDocuments` to `sessionRegisterSchema` and 12.4a added
 * `termsAccepted`; neither is one of them. One is an array of objects recording
 * what the app displayed, the other is a checkbox. Deriving this from the whole
 * schema swept them into the step machinery — the field-props map, the
 * `Controller` loop and the per-step completeness check all assume a string
 * field — so they are excluded here, at the one place that decides what a step
 * can hold.
 */
export type RegisterField = Exclude<
  keyof SessionRegisterInput,
  'shownLegalDocuments' | 'termsAccepted'
>;

export interface RegisterStep {
  /** Stable id — used as a key and in the spec, never rendered. */
  id: string;
  /** The fields this step puts in the bottom zone, in render order. */
  fields: readonly RegisterField[];
  /** The label on the step's own forward button. */
  action: string;
}

/**
 * `SCREEN_REDESIGNS.md` §2's progressive disclosure: "handle → email → password
 * as three steps sharing the top zone."
 *
 * **§2 names three steps; the schema has four fields.** `displayName` is
 * required by `sessionRegisterSchema` and Phase 3 is layout only — dropping it
 * or making it optional would be a validator change, not a recomposition. It
 * joins `handle` in the first step because they are the same question asked
 * twice (the name people read, the name the URL carries), which keeps §2's three
 * steps and leaves the last one a single password field before the submit.
 *
 * Each step carries the slice of the shared schema that gates it, so the
 * disabled state of "Continue" is decided by `@gmrlog/validators` and not by a
 * second set of rules written here.
 */
export const REGISTER_STEPS: readonly RegisterStep[] = [
  { id: 'identity', fields: ['displayName', 'handle'], action: 'Continue' },
  { id: 'email', fields: ['email'], action: 'Continue' },
  { id: 'password', fields: ['password'], action: 'Create account' },
] as const;

const STEP_SCHEMAS = [
  sessionRegisterSchema.pick({ displayName: true, handle: true }),
  sessionRegisterSchema.pick({ email: true }),
  sessionRegisterSchema.pick({ password: true }),
] as const;

/**
 * Whether a step's own fields pass the shared schema — the gate on its forward
 * button. §2: "the submit stays disabled, as it does now", which on a stepped
 * form has to mean each step's button, not only the last.
 *
 * The picked schemas keep `.strict()`, so only the step's own keys are handed
 * over; a field from a later step being empty cannot hold an earlier step shut.
 */
export function isRegisterStepComplete(
  index: number,
  values: Partial<Record<RegisterField, string>>,
): boolean {
  const step = REGISTER_STEPS[index];
  const schema = STEP_SCHEMAS[index];
  if (step === undefined || schema === undefined) return false;

  const subset: Record<string, string> = {};
  for (const field of step.fields) {
    subset[field] = values[field] ?? '';
  }

  return schema.safeParse(subset).success;
}

/**
 * 12.4 — whether the register screen's forward/submit button is disabled.
 *
 * Extracted from the screen so the two rules that are easy to get wrong are
 * testable without rendering.
 *
 * **The last step waits on the legal listing.** A player cannot agree to a
 * document the app has not loaded, and submitting without the versions would
 * either fail server-side or, worse, record agreement to something never shown.
 *
 * **The last step waits on the tick (12.4a).** The wire schema types
 * `termsAccepted` as `literal(true)`, so an unticked submission is refused
 * anyway — but a button that submits and then fails is a worse experience than
 * one that stays visibly disabled until the box is ticked.
 */
export function isRegisterSubmitDisabled(input: {
  busy: boolean;
  stepComplete: boolean;
  isLastStep: boolean;
  isFormValid: boolean;
  legalReady: boolean;
  termsAccepted: boolean;
}): boolean {
  if (input.busy || !input.stepComplete) {
    return true;
  }

  if (!input.isLastStep) {
    return false;
  }

  return !input.isFormValid || !input.legalReady || !input.termsAccepted;
}
